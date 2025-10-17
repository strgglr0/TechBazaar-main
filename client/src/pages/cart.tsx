import * as React from "react";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/hooks/use-cart";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function CartPage() {
  const { 
    cartItems, 
    isLoading, 
    totalAmount, 
    updateQuantity, 
    removeFromCart,
    clearCart
  } = useCart();
  
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const handleCheckout = () => {
    setLocation("/checkout");
  };

  const handleContinueShopping = () => {
    setLocation("/");
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-muted rounded mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-32 bg-muted rounded"></div>
              <div className="h-32 bg-muted rounded"></div>
            </div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="bg-card border-border text-center">
          <CardContent className="p-12">
            <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold font-lora text-foreground mb-4">
              Your cart is empty
            </h2>
            <p className="text-muted-foreground mb-6">
              Looks like you haven't added any products to your cart yet.
            </p>
            <Button onClick={handleContinueShopping} size="lg">
              Start Shopping
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-lora text-foreground">Shopping Cart</h1>
        <p className="text-muted-foreground mt-2">
          {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <div className="space-y-6">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 pb-6 border-b border-border last:border-0 last:pb-0">
                    {/* Product Image */}
                    <div className="flex-shrink-0 w-24 h-24 bg-muted rounded-lg overflow-hidden">
                      {item.product?.imageUrl ? (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                          <span className="text-muted-foreground text-xs">No image</span>
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1">
                      <h4 className="font-semibold font-geist text-foreground mb-1">
                        {item.product?.name || 'Unknown Product'}
                      </h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        {item.product?.category && (
                          <span className="capitalize">{item.product.category}</span>
                        )}
                      </p>
                      <p className="text-lg font-bold font-lora text-primary">
                        ₱{item.product?.price || '0.00'}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex flex-col items-end gap-3">
                      <div className="flex items-center border border-border rounded-lg">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateQuantity({ id: item.id, quantity: item.quantity - 1 })}
                          disabled={item.quantity <= 1}
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="px-4 py-1 font-geist min-w-[3rem] text-center">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateQuantity({ id: item.id, quantity: item.quantity + 1 })}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive/80"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>

                    {/* Item Total */}
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground mb-1">Subtotal</p>
                      <p className="text-lg font-bold font-lora text-foreground">
                        ₱{((parseFloat(item.product?.price || '0') * item.quantity)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={() => clearCart()}
                  className="text-destructive hover:text-destructive/80"
                >
                  Clear Cart
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleContinueShopping}
                >
                  Continue Shopping
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary & Account Details */}
        <div className="lg:col-span-1 space-y-4">
          {/* Account Information */}
          {user && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="font-lora">Account Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-geist font-medium text-muted-foreground mb-1">Name</p>
                  <p className="font-geist text-foreground">{user.name || 'Not provided'}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-geist font-medium text-muted-foreground mb-1">Email</p>
                  <p className="font-geist text-foreground">{user.email}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-geist font-medium text-muted-foreground mb-1">Contact Number</p>
                  <p className="font-geist text-foreground">
                    {(user as any).phone || 'Not provided'}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm font-geist font-medium text-muted-foreground mb-1">Shipping Address</p>
                  <p className="font-geist text-foreground">
                    {(user as any).shippingAddress ? (
                      <>
                        {(user as any).shippingAddress.address}<br />
                        {(user as any).shippingAddress.city}, {(user as any).shippingAddress.state} {(user as any).shippingAddress.zipCode}<br />
                        {(user as any).shippingAddress.country}
                      </>
                    ) : (
                      'Not provided'
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Summary */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="font-lora">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="font-geist text-muted-foreground">Subtotal</span>
                <span className="font-geist text-foreground">₱{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-geist text-muted-foreground">Shipping</span>
                <span className="font-geist text-foreground">
                  {totalAmount > 100 ? 'Free' : '₱9.99'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-geist text-muted-foreground">Tax (8%)</span>
                <span className="font-geist text-foreground">
                  ₱{(totalAmount * 0.08).toFixed(2)}
                </span>
              </div>

              <Separator />

              <div className="flex justify-between">
                <span className="text-lg font-bold font-lora text-foreground">Total</span>
                <span className="text-2xl font-bold font-lora text-primary">
                  ₱{(totalAmount + (totalAmount > 100 ? 0 : 9.99) + (totalAmount * 0.08)).toFixed(2)}
                </span>
              </div>

              {totalAmount < 100 && (
                <div className="bg-accent/50 border border-accent rounded-lg p-3">
                  <p className="text-xs font-geist text-accent-foreground">
                    Add ₱{(100 - totalAmount).toFixed(2)} more for free shipping!
                  </p>
                </div>
              )}

              <Button
                className="w-full bg-primary text-primary-foreground font-geist font-semibold hover:bg-primary/90"
                onClick={handleCheckout}
                size="lg"
              >
                Proceed to Checkout
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              {!user && (
                <p className="text-xs text-center text-muted-foreground">
                  Sign in to use saved shipping details
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
