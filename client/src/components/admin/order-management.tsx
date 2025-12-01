import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Package, CheckCircle, Clock, Truck, XCircle, Trash2, Receipt, RefreshCw, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Order } from "@/lib/types";

interface OrderManagementProps {
  orders: Order[];
  isLoading: boolean;
}

export default function OrderManagement({ orders, isLoading }: OrderManagementProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  const [refundOrderId, setRefundOrderId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const response = await apiRequest("PUT", `/api/orders/${orderId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "Success",
        description: "Order status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    },
  });

  const deleteOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest("DELETE", `/api/orders/${orderId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "Success",
        description: "Order deleted successfully",
      });
      setDeleteOrderId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete order",
        variant: "destructive",
      });
    },
  });

  const refundOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest("POST", `/api/orders/${orderId}/refund`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "Success",
        description: "Refund processed successfully",
      });
      setRefundOrderId(null);
      setIsReceiptOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process refund",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateStatusMutation.mutate({ orderId, status: newStatus });
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  const handleViewReceipt = (order: Order) => {
    setSelectedOrder(order);
    setIsReceiptOpen(true);
  };

  const handleDeleteOrder = (orderId: string) => {
    setDeleteOrderId(orderId);
  };

  const handleRefundOrder = (orderId: string) => {
    setRefundOrderId(orderId);
  };

  const confirmDelete = () => {
    if (deleteOrderId) {
      deleteOrderMutation.mutate(deleteOrderId);
    }
  };

  const confirmRefund = () => {
    if (refundOrderId) {
      refundOrderMutation.mutate(refundOrderId);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "processing":
        return <CheckCircle className="h-4 w-4" />;
      case "shipped":
        return <Truck className="h-4 w-4" />;
      case "delivered":
        return <Package className="h-4 w-4" />;
      case "received":
        return <CheckCircle className="h-4 w-4" />;
      case "refunded":
        return <RefreshCw className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" => {
    switch (status) {
      case "pending":
        return "secondary";
      case "processing":
      case "shipped":
      case "delivered":
      case "received":
        return "default";
      case "refunded":
        return "secondary";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground">Loading orders...</div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground">No orders found</div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold font-lora text-foreground">Order Management</h3>
        <div className="text-sm text-muted-foreground">
          Total Orders: {orders.length}
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-geist">Order ID</TableHead>
              <TableHead className="font-geist">Customer</TableHead>
              <TableHead className="font-geist">Date</TableHead>
              <TableHead className="font-geist">Amount</TableHead>
              <TableHead className="font-geist">Status</TableHead>
              <TableHead className="font-geist">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                <TableCell className="font-mono text-sm" data-testid={`text-order-id-${order.id}`}>
                  #{order.id.substring(0, 8)}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium font-geist" data-testid={`text-customer-name-${order.id}`}>
                      {order.customerName}
                    </span>
                    <span className="text-sm text-muted-foreground" data-testid={`text-customer-email-${order.id}`}>
                      {order.customerEmail}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="font-geist" data-testid={`text-order-date-${order.id}`}>
                  {order.createdAt ? format(new Date(order.createdAt), "MMM dd, yyyy") : "N/A"}
                </TableCell>
                <TableCell className="font-geist font-semibold" data-testid={`text-order-amount-${order.id}`}>
                  ₱{parseFloat((order as any).total || (order as any).totalAmount || '0').toLocaleString()}
                </TableCell>
                <TableCell>
                  <Select
                    value={order.status}
                    onValueChange={(value) => handleStatusChange(order.id, value)}
                  >
                    <SelectTrigger className="w-[140px]" data-testid={`select-status-${order.id}`}>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(order.status)}
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4" />
                          <span>Pending</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="processing">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4" />
                          <span>Processing</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="shipped">
                        <div className="flex items-center space-x-2">
                          <Truck className="h-4 w-4" />
                          <span>Shipped</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="delivered">
                        <div className="flex items-center space-x-2">
                          <Package className="h-4 w-4" />
                          <span>Delivered</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="received">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4" />
                          <span>Received</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="refunded">
                        <div className="flex items-center space-x-2">
                          <RefreshCw className="h-4 w-4" />
                          <span>Refunded</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="cancelled">
                        <div className="flex items-center space-x-2">
                          <XCircle className="h-4 w-4" />
                          <span>Cancelled</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(order)}
                      data-testid={`button-view-details-${order.id}`}
                    >
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewReceipt(order)}
                      data-testid={`button-view-receipt-${order.id}`}
                    >
                      <Receipt className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteOrder(order.id)}
                      data-testid={`button-delete-${order.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-lora">Order Details</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold font-geist mb-2">Order Information</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Order ID:</span> #{selectedOrder.id}</p>
                    <p><span className="text-muted-foreground">Date:</span> {selectedOrder.createdAt ? format(new Date(selectedOrder.createdAt), "PPP") : "N/A"}</p>
                    <div>
                      <span className="text-muted-foreground">Status:</span>{" "}
                      <Badge variant={getStatusVariant(selectedOrder.status)} className="ml-2">
                        {selectedOrder.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold font-geist mb-2">Customer Information</h4>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-muted-foreground">Name:</span> {selectedOrder.customerName}</p>
                    <p><span className="text-muted-foreground">Email:</span> {selectedOrder.customerEmail}</p>
                    <p><span className="text-muted-foreground">Phone:</span> {selectedOrder.customerPhone || "N/A"}</p>
                    <p>
                      <span className="text-muted-foreground">Payment:</span>{" "}
                      <Badge variant="outline" className="ml-1">
                        {(selectedOrder as any).paymentMethod === 'online' ? 'Online Payment' : 'Cash on Delivery'}
                      </Badge>
                    </p>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h4 className="font-semibold font-geist mb-2">Shipping Address</h4>
                <div className="text-sm bg-muted p-4 rounded-lg">
                  {typeof selectedOrder.shippingAddress === 'string' 
                    ? selectedOrder.shippingAddress
                    : (
                      <>
                        <p>{(selectedOrder.shippingAddress as any).address}</p>
                        <p>{(selectedOrder.shippingAddress as any).city}, {(selectedOrder.shippingAddress as any).state} {(selectedOrder.shippingAddress as any).zipCode}</p>
                        <p>{(selectedOrder.shippingAddress as any).country}</p>
                      </>
                    )
                  }
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-semibold font-geist mb-2">Order Items</h4>
                <div className="border border-border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.isArray(selectedOrder.items) && selectedOrder.items.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{item.productName || item.name || "Product"}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>₱{parseFloat(item.price).toLocaleString()}</TableCell>
                          <TableCell>₱{(parseFloat(item.price) * item.quantity).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Order Total */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-lg font-bold font-lora">
                    <span>Total:</span>
                    <span>₱{parseFloat((selectedOrder as any).total || (selectedOrder as any).totalAmount || '0').toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto print:shadow-none">
          <DialogHeader className="print:hidden">
            <DialogTitle className="font-lora flex items-center justify-between">
              <span>Order Receipt</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrintReceipt}
                className="ml-auto"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6 print:text-black">
              {/* Receipt Header */}
              <div className="text-center border-b pb-4">
                <h1 className="text-3xl font-bold font-lora mb-2">TechBazaar</h1>
                <p className="text-sm text-muted-foreground print:text-gray-600">
                  Order Receipt
                </p>
              </div>

              {/* Order & Customer Info Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold font-geist mb-3 text-lg">Order Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground print:text-gray-600">Order ID:</span>
                      <span className="font-mono font-semibold">#{selectedOrder.id.substring(0, 12)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground print:text-gray-600">Order Date:</span>
                      <span>{selectedOrder.createdAt ? format(new Date(selectedOrder.createdAt), "PPP") : "N/A"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground print:text-gray-600">Status:</span>
                      <Badge variant={getStatusVariant(selectedOrder.status)} className="print:border print:border-gray-400">
                        {selectedOrder.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground print:text-gray-600">Payment Method:</span>
                      <Badge variant="outline" className="print:border print:border-gray-400">
                        {(selectedOrder as any).paymentMethod === 'online' ? 'Online Payment' : 'Cash on Delivery'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold font-geist mb-3 text-lg">Customer Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground print:text-gray-600">Name:</span>
                      <span className="font-semibold">{selectedOrder.customerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground print:text-gray-600">Email:</span>
                      <span>{selectedOrder.customerEmail}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground print:text-gray-600">Phone:</span>
                      <span>{selectedOrder.customerPhone || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h3 className="font-semibold font-geist mb-3 text-lg">Shipping Address</h3>
                <div className="text-sm bg-muted print:bg-gray-100 p-4 rounded-lg">
                  {typeof selectedOrder.shippingAddress === 'string' 
                    ? selectedOrder.shippingAddress
                    : (
                      <>
                        <p className="font-medium">{(selectedOrder.shippingAddress as any).address}</p>
                        <p>{(selectedOrder.shippingAddress as any).city}, {(selectedOrder.shippingAddress as any).state} {(selectedOrder.shippingAddress as any).zipCode}</p>
                        <p>{(selectedOrder.shippingAddress as any).country}</p>
                      </>
                    )
                  }
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold font-geist mb-3 text-lg">Order Items</h3>
                <div className="border border-border print:border-gray-300 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="print:border-b print:border-gray-300">
                        <TableHead className="print:text-black">Product</TableHead>
                        <TableHead className="print:text-black text-center">Quantity</TableHead>
                        <TableHead className="print:text-black text-right">Unit Price</TableHead>
                        <TableHead className="print:text-black text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Array.isArray(selectedOrder.items) && selectedOrder.items.map((item: any, index: number) => (
                        <TableRow key={index} className="print:border-b print:border-gray-200">
                          <TableCell className="font-medium">{item.productName || item.name || "Product"}</TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right">₱{parseFloat(item.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                          <TableCell className="text-right font-semibold">₱{(parseFloat(item.price) * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Total Section */}
              <div className="border-t pt-4">
                <div className="flex justify-end">
                  <div className="w-80 space-y-3">
                    <div className="flex justify-between text-lg">
                      <span className="font-semibold">Subtotal:</span>
                      <span>₱{parseFloat((selectedOrder as any).total || (selectedOrder as any).totalAmount || '0').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-2xl font-bold font-lora border-t pt-3">
                      <span>Total:</span>
                      <span>₱{parseFloat((selectedOrder as any).total || (selectedOrder as any).totalAmount || '0').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    
                    {/* Refund Info */}
                    {(selectedOrder as any).refundedAt && (
                      <div className="border-t pt-3 mt-3">
                        <div className="flex justify-between text-lg text-orange-600 print:text-orange-700">
                          <span className="font-semibold">Refunded:</span>
                          <span className="font-bold">₱{parseFloat((selectedOrder as any).refundAmount || '0').toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <p className="text-xs text-muted-foreground print:text-gray-600 text-right mt-1">
                          Refunded on {format(new Date((selectedOrder as any).refundedAt), "PPP")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Refund Action */}
              {selectedOrder.status === 'received' && !(selectedOrder as any).refundedAt && (
                <div className="print:hidden border-t pt-4">
                  <div className="flex justify-end">
                    <Button
                      variant="destructive"
                      onClick={() => handleRefundOrder(selectedOrder.id)}
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Process Full Refund
                    </Button>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="text-center text-xs text-muted-foreground print:text-gray-600 border-t pt-4 mt-6">
                <p>Thank you for your purchase!</p>
                <p className="mt-1">For any inquiries, please contact support@techbazaar.com</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Refund Confirmation Dialog */}
      <AlertDialog open={!!refundOrderId} onOpenChange={(open) => !open && setRefundOrderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Process Refund?</AlertDialogTitle>
            <AlertDialogDescription>
              This will process a full refund for this order. The order status will be changed to "refunded" 
              and the refund amount will be recorded. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmRefund} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Process Refund
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteOrderId} onOpenChange={(open) => !open && setDeleteOrderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the order
              and remove it from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
