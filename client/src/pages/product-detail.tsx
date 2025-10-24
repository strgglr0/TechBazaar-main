import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { ArrowLeft, Star, ShoppingCart, Truck, Shield, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import ProductCard from "@/components/product-card";
import type { Product } from "@/lib/types";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [quantity, setQuantity] = useState(1);
  const { addToCart, isAddingToCart } = useCart();
  const { toast } = useToast();

  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: ['/api/products', id],
    queryFn: async () => {
      const response = await fetch(`/api/products/${id}`);
      if (!response.ok) throw new Error('Product not found');
      return response.json();
    },
    enabled: !!id,
  });

  // Track browsing history
  useEffect(() => {
    if (product?.id) {
      const token = localStorage.getItem('token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      else headers['x-session-id'] = 'default-session';
      
      fetch('/api/browsing-history', {
        method: 'POST',
        headers,
        body: JSON.stringify({ productId: product.id })
      }).catch(console.error);
    }
  }, [product?.id]);

  // Fetch recommendations
  const { data: recommendations = [] } = useQuery<Product[]>({
    queryKey: ['/api/recommendations', id],
    queryFn: async () => {
      const response = await fetch(`/api/recommendations?productId=${id}&limit=4`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!id,
  });

  // Fetch frequently bought together
  const { data: frequentlyBought = [] } = useQuery<Product[]>({
    queryKey: ['/api/frequently-bought-together', id],
    queryFn: async () => {
      const response = await fetch(`/api/frequently-bought-together?productId=${id}`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!id,
  });

  const handleAddToCart = () => {
    if (!product) return;
    
    addToCart({ productId: product.id, quantity });
    toast({
      title: "Added to cart",
      description: `${quantity} x ${product.name} added to your cart.`,
    });
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="h-5 w-5 fill-primary text-primary" />);
    }

    if (hasHalfStar) {
      stars.push(<Star key="half" className="h-5 w-5 fill-primary/50 text-primary" />);
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-5 w-5 text-muted-foreground" />);
    }

    return stars;
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 w-32 bg-muted rounded mb-8"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="aspect-square bg-muted rounded-lg"></div>
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-6 bg-muted rounded w-24"></div>
              <div className="h-12 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold font-lora text-foreground mb-4">Product Not Found</h2>
          <p className="text-muted-foreground mb-6">The product you're looking for doesn't exist.</p>
          <Link href="/">
            <Button>Back to Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  const specifications = product.specifications as Record<string, string> || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="mb-8">
        <Link href="/" data-testid="link-back">
          <Button variant="ghost" className="font-geist">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Product Image */}
        <div className="aspect-square relative overflow-hidden rounded-lg bg-muted">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
              data-testid="img-product"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-muted-foreground">No image available</span>
            </div>
          )}

          {product.stock < 10 && product.stock > 0 && (
            <Badge variant="secondary" className="absolute top-4 left-4">
              Low Stock
            </Badge>
          )}

          {product.stock === 0 && (
            <Badge variant="destructive" className="absolute top-4 left-4">
              Out of Stock
            </Badge>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold font-lora text-foreground mb-2" data-testid="text-product-name">
              {product.name}
            </h1>
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex items-center">
                {renderStars(parseFloat(product.rating || '0'))}
                <span className="ml-2 text-sm text-muted-foreground" data-testid="text-rating">
                  ({product.reviewCount} reviews)
                </span>
              </div>
              <Badge variant="outline" className="capitalize">
                {product.category}
              </Badge>
            </div>
            <p className="text-lg text-muted-foreground" data-testid="text-description">
              {product.description}
            </p>
          </div>

          <div>
            <span className="text-4xl font-bold font-lora text-orange-700 dark:text-orange-600" data-testid="text-price">
              ₱{product.price}
            </span>
          </div>

          {/* Add to Cart */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <label className="font-geist font-medium">Quantity:</label>
              <div className="flex items-center border border-border rounded-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  data-testid="button-decrease-quantity"
                >
                  -
                </Button>
                <span className="px-4 py-2 font-geist" data-testid="text-quantity">
                  {quantity}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={quantity >= product.stock}
                  data-testid="button-increase-quantity"
                >
                  +
                </Button>
              </div>
              <span className="text-sm text-muted-foreground">
                {product.stock} in stock
              </span>
            </div>

            <Button
              size="lg"
              className="w-full bg-primary text-primary-foreground font-geist font-semibold hover:bg-primary/90"
              onClick={handleAddToCart}
              disabled={isAddingToCart || product.stock === 0}
              data-testid="button-add-to-cart"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-border">
            <div className="flex items-center space-x-3">
              <Truck className="h-5 w-5 text-primary" />
              <span className="text-sm font-geist">Free Shipping</span>
            </div>
            <div className="flex items-center space-x-3">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-sm font-geist">1 Year Warranty</span>
            </div>
            <div className="flex items-center space-x-3">
              <RefreshCw className="h-5 w-5 text-primary" />
              <span className="text-sm font-geist">30-Day Returns</span>
            </div>
          </div>
        </div>
      </div>

      {/* Specifications */}
      {Object.keys(specifications).length > 0 && (
        <Card className="bg-card border-border mb-8">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold font-lora text-foreground mb-4">Specifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(specifications).map(([key, value]) => (
                <div key={key} className="flex justify-between py-2 border-b border-border">
                  <span className="font-geist font-medium capitalize text-foreground">
                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                  </span>
                  <span className="font-geist text-muted-foreground" data-testid={`spec-${key}`}>
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Frequently Bought Together */}
      {frequentlyBought.length > 0 && (
        <div className="mb-12">
          <h3 className="text-2xl font-bold font-lora text-foreground mb-6">
            Frequently Bought Together
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {frequentlyBought.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      )}

      {/* You May Also Like */}
      {recommendations.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold font-lora text-foreground mb-6">
            You May Also Like
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendations.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
