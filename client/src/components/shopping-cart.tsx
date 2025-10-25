import * as React from "react";
import { X, Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCart } from "@/hooks/use-cart";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { formatPrice } from "@/lib/formatters";

export default function ShoppingCartComponent() {
  const { 
    cartItems, 
    isLoading, 
    totalAmount, 
    isOpen, 
    setIsOpen, 
    updateQuantity, 
    removeFromCart 
  } = useCart();
  
  const [, setLocation] = useLocation();

  const handleCheckout = () => {
    // save any customer info entered in the cart so checkout page can prefill
    try {
      sessionStorage.setItem('checkoutCustomer', JSON.stringify(customer));
    } catch (e) {}
    setIsOpen(false);
    setLocation("/checkout");
  };

  // Customer info state
  const [customer, setCustomer] = React.useState({
    name: "",
    email: "",
    address: ""
  });
  const { user } = useAuth();

  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target as HTMLInputElement;
    setCustomer((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent side="right" className="w-full max-w-md">
        <SheetHeader>
          <SheetTitle className="font-lora">Shopping Cart</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-full">
          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto py-6">
            {isLoading ? (
              <div className="text-center text-muted-foreground">Loading cart...</div>
            ) : cartItems.length === 0 ? (
              <div className="text-center text-muted-foreground font-geist">
                Your cart is empty
              </div>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-center py-4 border-b border-border"
                    data-testid={`cart-item-${item.id}`}
                  >
                    <div className="flex-shrink-0 w-16 h-16 bg-muted rounded-lg overflow-hidden">
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
                    <div className="ml-4 flex-1">
                      <h4 className="font-medium font-geist text-foreground" data-testid={`text-product-name-${item.id}`}>
                        {item.product?.name || 'Unknown Product'}
                      </h4>
                      <p className="text-sm text-muted-foreground" data-testid={`text-price-${item.id}`}>
                        ₱{formatPrice(item.product?.price || '0.00')}
                      </p>
                      <div className="flex items-center mt-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateQuantity({ id: item.id, quantity: item.quantity - 1 })}
                          disabled={item.quantity <= 1}
                          data-testid={`button-decrease-${item.id}`}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="mx-3 font-geist" data-testid={`text-quantity-${item.id}`}>
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateQuantity({ id: item.id, quantity: item.quantity + 1 })}
                          data-testid={`button-increase-${item.id}`}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive/80 ml-4"
                      onClick={() => removeFromCart(item.id)}
                      data-testid={`button-remove-${item.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Customer Info Section */}
          {cartItems.length > 0 && (
            <div className="mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                  <CardDescription>Enter your details for checkout</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {user && (
                    <div className="mb-2 text-sm text-muted-foreground">
                      Signed in as <strong className="text-foreground">{user.name || user.email}</strong>
                      <button
                        className="ml-3 text-primary underline"
                        onClick={() => setCustomer({
                          name: user.name || '',
                          email: user.email || '',
                          address: customer.address,
                        })}
                      >
                        Use account details
                      </button>
                    </div>
                  )}
                  <Input
                    name="name"
                    placeholder="Full Name"
                    value={customer.name}
                    onChange={handleCustomerChange}
                    className="font-geist"
                  />
                  <Input
                    name="email"
                    type="email"
                    placeholder="Email Address"
                    value={customer.email}
                    onChange={handleCustomerChange}
                    className="font-geist"
                  />
                  <Input
                    name="address"
                    placeholder="Shipping Address"
                    value={customer.address}
                    onChange={handleCustomerChange}
                    className="font-geist"
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Cart Footer */}
          {cartItems.length > 0 && (
            <div className="border-t border-border pt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold font-geist text-foreground">Total:</span>
                <span className="text-2xl font-bold font-lora text-primary" data-testid="text-cart-total">
                  ₱{formatPrice(totalAmount)}
                </span>
              </div>
              <Button
                className="w-full bg-primary text-primary-foreground font-geist font-semibold hover:bg-primary/90"
                onClick={handleCheckout}
                data-testid="button-checkout"
              >
                Proceed to Checkout
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
