import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Package, ShoppingCart, DollarSign, AlertTriangle, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductTable from "@/components/admin/product-table";
import OrderManagement from "@/components/admin/order-management";
import AnalyticsDashboard from "@/components/admin/analytics-dashboard";
import type { Product, AdminStats, Order } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Admin() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading) {
      if (!user || !user.isAdmin) {
        setLocation('/login');
      }
    }
  }, [user, loading]);
  const { data: stats } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['/api/orders'],
    queryFn: async () => {
      const response = await fetch('/api/orders', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json();
    },
  });

  const statsCards = [
    {
      title: "Total Products",
      value: stats?.totalProducts || 0,
      icon: Package,
      color: "bg-primary/10 text-primary",
    },
    {
      title: "Orders Today",
      value: stats?.ordersToday || 0,
      icon: ShoppingCart,
      color: "bg-chart-2/10 text-chart-2",
    },
    {
      title: "Revenue",
      value: `₱${stats?.revenue?.toLocaleString() || 0}`,
      icon: DollarSign,
      color: "bg-green-500/10 text-green-500"
    },
    {
      title: "Low Stock",
      value: stats?.lowStock || 0,
      icon: AlertTriangle,
      color: "bg-chart-4/10 text-chart-4",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold font-lora text-foreground">Admin Dashboard</h2>
        <Link href="/" data-testid="link-storefront">
          <Button className="bg-primary text-primary-foreground font-geist font-medium hover:bg-primary/90">
            <Store className="h-4 w-4 mr-2" />
            View Storefront
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat, index) => (
          <Card key={index} className="bg-card border-border">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-geist text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold font-lora text-foreground" data-testid={`stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                    {stat.value}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Admin Tabs */}
      <Card className="bg-card border-border">
        <Tabs defaultValue="products" className="w-full">
          <CardHeader className="border-b border-border">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="products" className="font-geist" data-testid="tab-products">
                Products
              </TabsTrigger>
              <TabsTrigger value="orders" className="font-geist" data-testid="tab-orders">
                Orders
              </TabsTrigger>
              <TabsTrigger value="analytics" className="font-geist" data-testid="tab-analytics">
                Analytics
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="p-6">
            <TabsContent value="products" className="mt-0">
              <ProductTable products={products} isLoading={productsLoading} />
            </TabsContent>

            <TabsContent value="orders" className="mt-0">
              <OrderManagement orders={orders} isLoading={ordersLoading} />
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <AnalyticsDashboard isLoading={false} />
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
