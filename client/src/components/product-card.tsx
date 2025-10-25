import { Star, ShoppingCart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { formatPrice } from "@/lib/formatters";
import type { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart, isAddingToCart } = useCart();
  const { toast } = useToast();

  const handleAddToCart = () => {
    addToCart({ productId: product.id });
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`,
    });
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="h-4 w-4 fill-primary text-primary" />);
    }

    if (hasHalfStar) {
      stars.push(<Star key="half" className="h-4 w-4 fill-primary/50 text-primary" />);
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="h-4 w-4 text-muted-foreground" />);
    }

    return stars;
  };

  return (
    <Card className="product-card bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-all duration-200" data-testid={`card-product-${product.id}`}>
      <Link href={`/product/${product.id}`} data-testid={`link-product-${product.id}`}>
        <div className="aspect-square relative overflow-hidden">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-muted-foreground">No image</span>
            </div>
          )}
          
          {product.stock < 10 && product.stock > 0 && (
            <Badge variant="secondary" className="absolute top-2 left-2">
              Low Stock
            </Badge>
          )}
          
          {product.stock === 0 && (
            <Badge variant="destructive" className="absolute top-2 left-2">
              Out of Stock
            </Badge>
          )}
        </div>
      </Link>
      
      <CardContent className="p-4">
        <Link href={`/product/${product.id}`}>
          <h4 className="font-semibold font-geist text-foreground mb-2 hover:text-primary transition-colors" data-testid={`text-product-name-${product.id}`}>
            {product.name}
          </h4>
        </Link>
        
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2" data-testid={`text-description-${product.id}`}>
          {product.description}
        </p>
        
        <div className="flex items-center mb-3">
          <div className="flex text-sm">
            {renderStars(parseFloat(product.rating || '0'))}
          </div>
          <span className="text-sm text-muted-foreground ml-2" data-testid={`text-reviews-${product.id}`}>
            ({product.reviewCount} reviews)
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold font-lora text-orange-700 dark:text-orange-600" data-testid={`text-price-${product.id}`}>
            ₱{formatPrice(product.price)}
          </span>
          <Button
            className="bg-primary text-primary-foreground font-geist font-medium hover:bg-primary/90"
            onClick={handleAddToCart}
            disabled={isAddingToCart || product.stock === 0}
            data-testid={`button-add-to-cart-${product.id}`}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
