"""
Force update database schema by removing default status value
This will update the existing database without losing data
"""
from app import create_app
from extensions import db
from sqlalchemy import text

def update_schema():
    """Update the status column to remove default value"""
    app = create_app()
    
    with app.app_context():
        try:
            print("Updating Order table schema...")
            
            # For SQLite, we need to recreate the table to change column definition
            # First, let's check current orders
            result = db.session.execute(text("SELECT COUNT(*) FROM orders"))
            order_count = result.scalar()
            print(f"Found {order_count} existing orders")
            
            if order_count > 0:
                print("Backing up orders...")
                # Create backup table
                db.session.execute(text("""
                    CREATE TABLE IF NOT EXISTS orders_backup AS 
                    SELECT * FROM orders
                """))
                db.session.commit()
                print("Orders backed up to orders_backup table")
            
            # Drop and recreate orders table with correct schema
            print("Dropping orders table...")
            db.session.execute(text("DROP TABLE IF EXISTS orders"))
            db.session.commit()
            
            print("Creating orders table with correct schema (no default status)...")
            db.session.execute(text("""
                CREATE TABLE orders (
                    id VARCHAR(64) PRIMARY KEY,
                    user_id INTEGER,
                    customer_name VARCHAR(255),
                    customer_email VARCHAR(255),
                    customer_phone VARCHAR(64),
                    shipping_address JSON,
                    items JSON NOT NULL,
                    total FLOAT DEFAULT 0.0,
                    payment_method VARCHAR(32) DEFAULT 'cod',
                    status VARCHAR(32) NOT NULL,
                    refunded_at DATETIME,
                    refund_amount FLOAT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(user_id) REFERENCES users(id)
                )
            """))
            db.session.commit()
            
            if order_count > 0:
                print("Restoring orders from backup...")
                db.session.execute(text("""
                    INSERT INTO orders 
                    SELECT * FROM orders_backup
                """))
                db.session.commit()
                
                print("Dropping backup table...")
                db.session.execute(text("DROP TABLE orders_backup"))
                db.session.commit()
            
            print("\n✓ Schema update complete!")
            print("The 'status' column no longer has a default value.")
            print("All new orders will use the status set in the code (pending_payment).")
            
        except Exception as e:
            print(f"\n✗ Error updating schema: {e}")
            db.session.rollback()
            raise

if __name__ == '__main__':
    update_schema()
