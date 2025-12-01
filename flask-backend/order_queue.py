"""
Order Processing Queue System
Uses Python's queue.Queue data structure to manage order status progression.
Status flow: processing -> delivered -> received
"""

import queue
import threading
import time
from datetime import datetime
from extensions import db
# Lazy import to avoid circular dependency
# from models import Order


class OrderProcessingQueue:
    """
    Manages order processing using a Queue data structure.
    Orders progress through: processing -> delivered -> received
    """
    
    def __init__(self, app=None):
        self.processing_queue = queue.Queue()
        self.delivery_queue = queue.Queue()
        self.completed_orders = {}  # order_id -> completion_time
        self.worker_thread = None
        self.running = False
        self.app = app
        
    def init_app(self, app):
        """Initialize with Flask app context"""
        self.app = app
        
    def start(self):
        """Start the background worker thread"""
        if self.running:
            return
        
        self.running = True
        self.worker_thread = threading.Thread(target=self._process_orders, daemon=True)
        self.worker_thread.start()
        print("[OrderQueue] Order processing queue started")
        
    def stop(self):
        """Stop the background worker thread"""
        self.running = False
        if self.worker_thread:
            self.worker_thread.join(timeout=2)
        print("[OrderQueue] Order processing queue stopped")
        
    def add_order(self, order_id):
        """
        Add a new order to the processing queue.
        Order starts with 'processing' status.
        """
        self.processing_queue.put({
            'order_id': order_id,
            'queued_at': datetime.utcnow(),
            'status': 'processing'
        })
        print(f"[OrderQueue] Order {order_id} added to processing queue")
        
    def get_order_status(self, order_id):
        """
        Get current status of an order based on which queue it's in.
        Returns: 'processing', 'delivered', or 'received'
        """
        # Check if order is completed
        if order_id in self.completed_orders:
            return 'received'
        
        # Check delivery queue
        delivery_items = list(self.delivery_queue.queue)
        for item in delivery_items:
            if item['order_id'] == order_id:
                return 'delivered'
        
        # Check processing queue
        processing_items = list(self.processing_queue.queue)
        for item in processing_items:
            if item['order_id'] == order_id:
                return 'processing'
        
        # Default to processing if not found
        return 'processing'
        
    def _process_orders(self):
        """
        Background worker that processes orders through the queues.
        Processing -> (24h) -> Delivered -> (manual confirmation) -> Received
        Note: For testing, change times to smaller values (e.g., 10 seconds)
        """
        while self.running:
            try:
                # Process from processing queue to delivery queue (after 24 hours = 86400 seconds)
                if not self.processing_queue.empty():
                    item = self.processing_queue.get(timeout=1)
                    elapsed = (datetime.utcnow() - item['queued_at']).total_seconds()
                    
                    if elapsed >= 86400:  # 24 hours
                        # Move to delivery queue
                        item['status'] = 'delivered'
                        item['delivered_at'] = datetime.utcnow()
                        self.delivery_queue.put(item)
                        print(f"[OrderQueue] Order {item['order_id']} moved to delivery")
                        
                        # Update database
                        if self.app:
                            with self.app.app_context():
                                from models import Order
                                order = Order.query.get(item['order_id'])
                                if order:
                                    order.status = 'delivered'
                                    db.session.commit()
                    else:
                        # Put back in queue if not ready
                        self.processing_queue.put(item)
                
                # Process from delivery queue to completed (after customer confirms receipt)
                # Note: Customer must manually confirm receipt, so we use a very long timeout
                if not self.delivery_queue.empty():
                    item = self.delivery_queue.get(timeout=1)
                    elapsed = (datetime.utcnow() - item['delivered_at']).total_seconds()
                    
                    # Don't auto-complete - customer must confirm manually
                    # Keep a very high number to prevent auto-completion
                    if elapsed >= 999999999:
                        # Mark as received/completed
                        item['status'] = 'received'
                        item['received_at'] = datetime.utcnow()
                        self.completed_orders[item['order_id']] = datetime.utcnow()
                        print(f"[OrderQueue] Order {item['order_id']} completed (received)")
                        
                        # Update database
                        if self.app:
                            with self.app.app_context():
                                from models import Order
                                order = Order.query.get(item['order_id'])
                                if order:
                                    order.status = 'received'
                                    db.session.commit()
                    else:
                        # Put back in queue if not ready
                        self.delivery_queue.put(item)
                
                # Sleep briefly to avoid busy waiting
                time.sleep(1)
                
            except queue.Empty:
                continue
            except Exception as e:
                print(f"[OrderQueue] Error processing orders: {e}")
                time.sleep(1)


# Global instance
order_queue = OrderProcessingQueue()
