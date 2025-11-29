import { useQuery } from "@tanstack/react-query";
import { Star, Package, User } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Product } from "@/lib/types";

interface Rating {
  id: number;
  userId: number;
  productId: string;
  orderId: string;
  rating: number;
  review: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function RatingsMonitor({ isLoading }: { isLoading: boolean }) {
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['/api/products'],
  });

  // Calculate rating statistics
  const ratingStats = products.reduce((acc, product) => {
    const rating = parseFloat(product.rating || '0');
    const count = product.reviewCount || 0;
    
    return {
      totalReviews: acc.totalReviews + count,
      avgRating: acc.totalProducts > 0 
        ? (acc.avgRating * acc.totalProducts + rating) / (acc.totalProducts + 1)
        : rating,
      totalProducts: acc.totalProducts + 1,
      fiveStars: acc.fiveStars + (rating >= 4.5 ? 1 : 0),
      fourStars: acc.fourStars + (rating >= 3.5 && rating < 4.5 ? 1 : 0),
      threeStars: acc.threeStars + (rating >= 2.5 && rating < 3.5 ? 1 : 0),
      lowRated: acc.lowRated + (rating < 2.5 && count > 0 ? 1 : 0),
    };
  }, {
    totalReviews: 0,
    avgRating: 0,
    totalProducts: 0,
    fiveStars: 0,
    fourStars: 0,
    threeStars: 0,
    lowRated: 0,
  });

  // Sort products by rating (highest first) and then by review count
  const sortedProducts = [...products].sort((a, b) => {
    const ratingDiff = parseFloat(b.rating || '0') - parseFloat(a.rating || '0');
    if (Math.abs(ratingDiff) > 0.01) return ratingDiff;
    return (b.reviewCount || 0) - (a.reviewCount || 0);
  });

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-600";
    if (rating >= 3.5) return "text-blue-600";
    if (rating >= 2.5) return "text-yellow-600";
    return "text-red-600";
  };

  const getRatingBadge = (rating: number) => {
    if (rating >= 4.5) return "default";
    if (rating >= 3.5) return "secondary";
    if (rating >= 2.5) return "outline";
    return "destructive";
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading ratings data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Rating Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ratingStats.totalReviews}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {ratingStats.totalProducts} products
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              {ratingStats.avgRating.toFixed(2)} <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Overall store rating
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Top Rated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{ratingStats.fiveStars}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Products with 4.5+ stars
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{ratingStats.lowRated}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Products below 2.5 stars
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Products Rating Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Product Ratings Overview
          </CardTitle>
          <CardDescription>
            Monitor customer ratings and reviews. Ratings are automatically calculated from customer feedback after order delivery.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">Rating</TableHead>
                  <TableHead className="text-center">Reviews</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No products with ratings yet
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedProducts.map((product) => {
                    const rating = parseFloat(product.rating || '0');
                    const reviewCount = product.reviewCount || 0;
                    
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {product.imageUrl ? (
                              <img 
                                src={product.imageUrl} 
                                alt={product.name}
                                className="h-10 w-10 object-cover rounded"
                              />
                            ) : (
                              <div className="h-10 w-10 bg-muted rounded flex items-center justify-center">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-muted-foreground">₱{parseFloat(product.price).toLocaleString()}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.category || 'Uncategorized'}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <span className={`font-bold ${getRatingColor(rating)}`}>
                              {rating.toFixed(2)}
                            </span>
                            <Star className={`h-4 w-4 ${rating > 0 ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{reviewCount}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {reviewCount === 0 ? (
                            <Badge variant="secondary">No reviews</Badge>
                          ) : (
                            <Badge variant={getRatingBadge(rating)}>
                              {rating >= 4.5 ? 'Excellent' : 
                               rating >= 3.5 ? 'Good' : 
                               rating >= 2.5 ? 'Average' : 
                               'Poor'}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
