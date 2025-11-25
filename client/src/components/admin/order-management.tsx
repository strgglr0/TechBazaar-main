import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Package, CheckCircle, Clock, Truck, XCircle, Trash2 } from "lucide-react";
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
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
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

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateStatusMutation.mutate({ orderId, status: newStatus });
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  const handleDeleteOrder = (orderId: string) => {
    setDeleteOrderId(orderId);
  };

  const confirmDelete = () => {
    if (deleteOrderId) {
      deleteOrderMutation.mutate(deleteOrderId);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "confirmed":
        return <CheckCircle className="h-4 w-4" />;
      case "shipped":
        return <Truck className="h-4 w-4" />;
      case "delivered":
        return <Package className="h-4 w-4" />;
      case "received":
        return <CheckCircle className="h-4 w-4" />;
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
      case "confirmed":
      case "shipped":
      case "delivered":
      case "received":
        return "default";
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
                      <SelectItem value="confirmed">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4" />
                          <span>Confirmed</span>
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
                    <p>
                      <span className="text-muted-foreground">Status:</span>{" "}
                      <Badge variant={getStatusVariant(selectedOrder.status)} className="ml-2">
                        {selectedOrder.status}
                      </Badge>
                    </p>
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
