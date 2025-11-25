import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { User, Package, MapPin, Phone, Mail, Edit2, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { sanitizePhoneInput, hasMeaningfulChange } from "@/lib/formatters";
import type { Order } from "@/lib/types";

interface UserProfile {
  id: number;
  email: string;
  name: string;
  phone?: string;
  shippingAddress?: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export default function Profile() {
  const { user, isAuthenticated, loading: authLoading, token } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
  });

  const [addressForm, setAddressForm] = useState({
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "Philippines",
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  // Fetch user profile
  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ['/api/profile'],
    queryFn: async () => {
      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch profile');
      return response.json();
    },
    enabled: isAuthenticated,
  });

  // Fetch user orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['/api/user/orders'],
    queryFn: async () => {
      const response = await fetch('/api/user/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
    enabled: isAuthenticated,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name: string; phone: string }) => {
      const response = await apiRequest("PUT", `/api/profile`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setIsEditingProfile(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  // Update address mutation
  const updateAddressMutation = useMutation({
    mutationFn: async (data: typeof addressForm) => {
      const response = await apiRequest("PUT", `/api/profile/address`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      toast({
        title: "Success",
        description: "Address updated successfully",
      });
      setIsEditingAddress(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update address",
        variant: "destructive",
      });
    },
  });

  // Confirm receipt mutation
  const confirmReceiptMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const response = await apiRequest("POST", `/api/orders/${orderId}/confirm-receipt`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/orders'] });
      toast({
        title: "Receipt Confirmed",
        description: "Thank you for confirming the receipt of your order!",
      });
      setIsOrderDetailsOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to confirm receipt",
        variant: "destructive",
      });
    },
  });

  // Initialize form values when profile data is loaded
  useEffect(() => {
    if (profile) {
      setProfileForm({
        name: profile.name || "",
        phone: profile.phone || "",
      });
      setAddressForm({
        address: profile.shippingAddress?.address || "",
        city: profile.shippingAddress?.city || "",
        state: profile.shippingAddress?.state || "",
        zipCode: profile.shippingAddress?.zipCode || "",
        country: profile.shippingAddress?.country || "Philippines",
      });
    }
  }, [profile]);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if name has changed
    const nameChanged = hasMeaningfulChange(profileForm.name, profile?.name || "");
    const phoneChanged = hasMeaningfulChange(profileForm.phone, profile?.phone || "");
    
    if (!nameChanged && !phoneChanged) {
      toast({
        title: "No changes",
        description: "Please make changes before saving",
        variant: "destructive",
      });
      return;
    }
    
    // Validate name is not empty
    if (!profileForm.name.trim()) {
      toast({
        title: "Invalid name",
        description: "Name cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    updateProfileMutation.mutate(profileForm);
  };

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if any address field has changed
    const hasChanges = 
      hasMeaningfulChange(addressForm.address, profile?.shippingAddress?.address || "") ||
      hasMeaningfulChange(addressForm.city, profile?.shippingAddress?.city || "") ||
      hasMeaningfulChange(addressForm.state, profile?.shippingAddress?.state || "") ||
      hasMeaningfulChange(addressForm.zipCode, profile?.shippingAddress?.zipCode || "") ||
      hasMeaningfulChange(addressForm.country, profile?.shippingAddress?.country || "");
    
    if (!hasChanges) {
      toast({
        title: "No changes",
        description: "Please make changes before saving",
        variant: "destructive",
      });
      return;
    }
    
    updateAddressMutation.mutate(addressForm);
  };

  const handleCancelProfileEdit = () => {
    setIsEditingProfile(false);
    if (profile) {
      setProfileForm({
        name: profile.name || "",
        phone: profile.phone || "",
      });
    }
  };

  const handleCancelAddressEdit = () => {
    setIsEditingAddress(false);
    if (profile) {
      setAddressForm({
        address: profile.shippingAddress?.address || "",
        city: profile.shippingAddress?.city || "",
        state: profile.shippingAddress?.state || "",
        zipCode: profile.shippingAddress?.zipCode || "",
        country: profile.shippingAddress?.country || "Philippines",
      });
    }
  };

  const handleViewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsOrderDetailsOpen(true);
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" => {
    switch (status) {
      case "pending":
      case "processing":
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

  if (authLoading || profileLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-muted-foreground">Loading profile...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-muted-foreground">Failed to load profile</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold font-lora text-foreground">My Profile</h1>
        <p className="text-muted-foreground mt-2">Manage your account and view your orders</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Profile Information</TabsTrigger>
          <TabsTrigger value="orders">My Orders</TabsTrigger>
        </TabsList>

        {/* Profile Information Tab */}
        <TabsContent value="profile" className="space-y-6">
          {/* Personal Information Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>Update your personal details</CardDescription>
                </div>
                {!isEditingProfile && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingProfile(true)}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      disabled={!isEditingProfile}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => {
                        const sanitized = sanitizePhoneInput(e.target.value);
                        setProfileForm({ ...profileForm, phone: sanitized });
                      }}
                      disabled={!isEditingProfile}
                      placeholder="Enter your phone number (digits only)"
                      maxLength={11}
                    />
                    <p className="text-xs text-muted-foreground">Numbers only (e.g., 09171234567)</p>
                  </div>
                </div>

                {isEditingProfile && (
                  <div className="flex gap-2">
                    <Button type="submit" disabled={updateProfileMutation.isPending}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelProfileEdit}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Shipping Address Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Shipping Address
                  </CardTitle>
                  <CardDescription>Manage your default shipping address</CardDescription>
                </div>
                {!isEditingAddress && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingAddress(true)}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddressSubmit} className="space-y-4">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Street Address</Label>
                    <Input
                      id="address"
                      type="text"
                      value={addressForm.address}
                      onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                      disabled={!isEditingAddress}
                      placeholder="Enter your street address"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        type="text"
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        disabled={!isEditingAddress}
                        placeholder="Enter your city"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="state">State/Province</Label>
                      <Input
                        id="state"
                        type="text"
                        value={addressForm.state}
                        onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                        disabled={!isEditingAddress}
                        placeholder="Enter your state/province"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input
                        id="zipCode"
                        type="text"
                        value={addressForm.zipCode}
                        onChange={(e) => setAddressForm({ ...addressForm, zipCode: e.target.value })}
                        disabled={!isEditingAddress}
                        placeholder="Enter your ZIP code"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        type="text"
                        value={addressForm.country}
                        onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                        disabled={!isEditingAddress}
                        placeholder="Enter your country"
                      />
                    </div>
                  </div>
                </div>

                {isEditingAddress && (
                  <div className="flex gap-2">
                    <Button type="submit" disabled={updateAddressMutation.isPending}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Address
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelAddressEdit}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                My Orders
              </CardTitle>
              <CardDescription>
                View and track your order history
              </CardDescription>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className="text-center py-8">
                  <div className="text-muted-foreground">Loading orders...</div>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No orders yet</p>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setLocation("/")}
                  >
                    Start Shopping
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono text-sm">
                            #{order.id.substring(0, 8)}
                          </TableCell>
                          <TableCell>
                            {order.createdAt ? format(new Date(order.createdAt), "MMM dd, yyyy") : "N/A"}
                          </TableCell>
                          <TableCell>
                            {Array.isArray(order.items) ? order.items.length : 0} item(s)
                          </TableCell>
                          <TableCell className="font-semibold">
                            ₱{parseFloat((order as any).total || (order as any).totalAmount || '0').toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(order.status)}>
                              {order.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewOrderDetails(order)}
                              >
                                View Details
                              </Button>
                              {order.status === 'delivered' && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => confirmReceiptMutation.mutate(order.id)}
                                  disabled={confirmReceiptMutation.isPending}
                                >
                                  <Package className="h-4 w-4 mr-1" />
                                  Confirm Receipt
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Order Details Dialog */}
      <Dialog open={isOrderDetailsOpen} onOpenChange={setIsOrderDetailsOpen}>
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
                  <h4 className="font-semibold font-geist mb-2">Contact Information</h4>
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

              {/* Confirm Receipt Button */}
              {selectedOrder.status === 'delivered' && (
                <div className="flex justify-end pt-4 border-t border-border">
                  <Button
                    onClick={() => confirmReceiptMutation.mutate(selectedOrder.id)}
                    disabled={confirmReceiptMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <Package className="h-4 w-4" />
                    {confirmReceiptMutation.isPending ? "Confirming..." : "Confirm Receipt"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
