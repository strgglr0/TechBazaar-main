import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ArrowLeft, CreditCard, Truck, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";

const checkoutSchema = z.object({
  customerName: z.string().min(1, "Name is required"),
  customerEmail: z.string().email("Valid email is required"),
  customerPhone: z.string().min(10, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(5, "ZIP code is required"),
  country: z.string().min(1, "Country is required"),
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function Checkout() {
  const [, setLocation] = useLocation();
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState<string>("");
  const [orderStatus, setOrderStatus] = useState<string | null>(null);
  const { cartItems, totalAmount, clearCart } = useCart();
  const { user, token } = useAuth();
  const { toast } = useToast();

  const form = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: user?.name || "",
      customerEmail: user?.email || "",
      customerPhone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "United States",
    },
  });

  // If user came from cart and populated customer fields there, prefer those values
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('checkoutCustomer');
      if (raw) {
        const parsed = JSON.parse(raw);
        form.reset({
          ...form.getValues(),
          customerName: parsed.name || user?.name || '',
          customerEmail: parsed.email || user?.email || '',
          address: parsed.address || form.getValues().address,
        });
        sessionStorage.removeItem('checkoutCustomer');
      }
    } catch (e) {}
  }, []);

  const createOrderMutation = useMutation({
    mutationFn: async (data: CheckoutFormData) => {
      const orderData = {
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        shippingAddress: {
          address: data.address,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
          country: data.country,
        },
        items: cartItems.map(item => ({
          productId: item.productId,
          productName: item.product?.name || "Unknown Product",
          price: item.product?.price || "0.00",
          quantity: item.quantity,
        })),
        totalAmount: totalAmount.toFixed(2),
      };

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      // include session header for guest carts
      headers['x-session-id'] = 'default-session';

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers,
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const txt = await response.text();
        throw new Error(txt || response.statusText);
      }

      return response.json();
    },
    onSuccess: (order) => {
      setOrderId(order.id);
      setOrderStatus('pending');
      // do not mark complete yet; poll will update status
      clearCart();
      toast({
        title: "Order placed successfully!",
        description: `Your order #${order.id.slice(-8)} has been created. Tracking will update shortly.`,
      });
    },
    onError: () => {
      toast({
        title: "Order failed",
        description: "There was an error processing your order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CheckoutFormData) => {
    createOrderMutation.mutate(data);
  };

  // Poll order status for created order every 5s until complete
  useEffect(() => {
    let interval: any;
    const poll = async () => {
      if (!orderId) return;
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        if (!res.ok) return;
        const json = await res.json();
        setOrderStatus(json.status || null);
        if (json.status === 'complete') {
          setOrderComplete(true);
          clearInterval(interval);
        }
      } catch (e) {
        // ignore
      }
    };
    if (orderId) {
      poll();
      interval = setInterval(poll, 5000);
    }
    return () => clearInterval(interval);
  }, [orderId]);

  const handleBackToShopping = () => {
    setLocation("/");
  };

  // Redirect if cart is empty and order is not complete
  // If cart is empty and no active order, redirect to shopping
  if (cartItems.length === 0 && !orderComplete && !orderId) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="bg-card border-border text-center">
          <CardContent className="p-12">
            <h2 className="text-2xl font-bold font-lora text-foreground mb-4">
              Your cart is empty
            </h2>
            <p className="text-muted-foreground mb-6">
              Add some products to your cart before proceeding to checkout.
            </p>
            <Button onClick={handleBackToShopping} data-testid="button-back-shopping">
              Continue Shopping
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Order completion screen
  if (orderComplete) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="bg-card border-border text-center">
          <CardContent className="p-12">
            <div className="flex justify-center mb-6">
              <CheckCircle className="h-16 w-16 text-primary" />
            </div>
            <h2 className="text-3xl font-bold font-lora text-foreground mb-4">
              Order Confirmed!
            </h2>
            <p className="text-lg text-muted-foreground mb-2">
              Thank you for your purchase
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              Order ID: #{orderId.slice(-8)}
            </p>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                You will receive an email confirmation shortly with your order details and tracking information.
              </p>
              <Button onClick={handleBackToShopping} size="lg" data-testid="button-continue-shopping">
                Continue Shopping
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If order was created and not yet complete, show status page
  if (orderId && !orderComplete) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="bg-card border-border text-center">
          <CardContent className="p-12">
            <div className="flex justify-center mb-6">
              <Truck className="h-16 w-16 text-primary" />
            </div>
            <h2 className="text-2xl font-bold font-lora text-foreground mb-4">Order Processing</h2>
            <p className="text-muted-foreground mb-4">Your order is being processed. We'll update the status shortly.</p>
            <div className="mb-4">
              <strong>Order ID:</strong> #{orderId.slice(-8)}
            </div>
            <div className="mb-6">
              <div aria-live="polite" className="text-lg font-semibold">
                Status: {orderStatus || 'pending'}
              </div>
            </div>
            <div>
              <Button onClick={handleBackToShopping} size="lg">Continue Shopping</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const shippingCost = totalAmount > 100 ? 0 : 9.99;
  const tax = totalAmount * 0.08; // 8% tax
  const finalTotal = totalAmount + shippingCost + tax;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={handleBackToShopping}
          className="font-geist"
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Shopping
        </Button>
        <h1 className="text-3xl font-bold font-lora text-foreground mt-4">Checkout</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="font-lora flex items-center">
                <Truck className="h-5 w-5 mr-2 text-primary" />
                Shipping Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Customer Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="customerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-geist">Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customerEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-geist">Email Address</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" data-testid="input-email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="customerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-geist">Phone Number</FormLabel>
                        <FormControl>
                          <Input {...field} type="tel" data-testid="input-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Separator />

                  {/* Shipping Address */}
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-geist">Street Address</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={2} data-testid="input-address" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-geist">City</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-city" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-geist">State</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-state" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-geist">ZIP Code</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-zip" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-geist">Country</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-country" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-primary text-primary-foreground font-geist font-semibold hover:bg-primary/90"
                    disabled={createOrderMutation.isPending}
                    data-testid="button-place-order"
                  >
                    <CreditCard className="h-5 w-5 mr-2" />
                    {createOrderMutation.isPending ? "Processing..." : "Place Order"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="bg-card border-border sticky top-24">
            <CardHeader>
              <CardTitle className="font-lora">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cart Items */}
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-3" data-testid={`order-item-${item.id}`}>
                    <div className="flex-shrink-0 w-12 h-12 bg-muted rounded-lg overflow-hidden">
                      {item.product?.imageUrl ? (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium font-geist text-foreground truncate">
                        {item.product?.name || 'Unknown Product'}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity} × ${item.product?.price || '0.00'}
                      </p>
                    </div>
                    <div className="text-sm font-medium font-geist text-foreground">
                      ${((parseFloat(item.product?.price || '0') * item.quantity)).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Pricing Breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-geist text-muted-foreground">Subtotal</span>
                  <span className="font-geist text-foreground" data-testid="text-subtotal">
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-geist text-muted-foreground">Shipping</span>
                  <span className="font-geist text-foreground" data-testid="text-shipping">
                    {shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-geist text-muted-foreground">Tax</span>
                  <span className="font-geist text-foreground" data-testid="text-tax">
                    ${tax.toFixed(2)}
                  </span>
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span className="font-lora text-foreground">Total</span>
                  <span className="font-lora text-primary" data-testid="text-total">
                    ${finalTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Free Shipping Notice */}
              {totalAmount < 100 && (
                <div className="bg-accent/50 border border-accent rounded-lg p-3">
                  <p className="text-xs font-geist text-accent-foreground">
                    Add ${(100 - totalAmount).toFixed(2)} more for free shipping!
                  </p>
                </div>
              )}

              {totalAmount >= 100 && (
                <div className="bg-primary/10 border border-primary rounded-lg p-3">
                  <p className="text-xs font-geist text-primary">
                    ✓ You qualify for free shipping!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
