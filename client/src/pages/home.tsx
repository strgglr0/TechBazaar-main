import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Smartphone, Laptop, Monitor, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProductCard from "@/components/product-card";
import ProductFiltersComponent from "@/components/product-filters";
import BrowsingHistory from "@/components/browsing-history";
import type { Product, Category, ProductFilters } from "@/lib/types";

export default function Home() {
  const [location] = useLocation();
  const [filters, setFilters] = useState<ProductFilters>({});
  const [sortBy, setSortBy] = useState("featured");

  // Parse URL search params on component mount and location change
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1] || '');
    const searchQuery = params.get('search');
    const category = params.get('category');
    
    setFilters(prev => ({
      ...prev,
      searchQuery: searchQuery || undefined,
      category: category || undefined,
    }));
  }, [location]);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['/api/products', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.brand) params.append('brand', filters.brand);
      if (filters.minPrice !== undefined) params.append('minPrice', filters.minPrice.toString());
      if (filters.maxPrice !== undefined) params.append('maxPrice', filters.maxPrice.toString());
      if (filters.rating) params.append('rating', filters.rating.toString());
      if (filters.searchQuery) params.append('search', filters.searchQuery);

      const url = `/api/products?${params.toString()}`;
      console.log('[DEBUG] Fetching products with filters:', filters);
      console.log('[DEBUG] API URL:', url);
      console.log('[DEBUG] Price params - min:', filters.minPrice, 'max:', filters.maxPrice);
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      console.log('[DEBUG] Received products count:', data.length);
      return data;
    },
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Sort products
  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return parseFloat(a.price) - parseFloat(b.price);
      case "price-high":
        return parseFloat(b.price) - parseFloat(a.price);
      case "newest":
        return new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime();
      case "rating":
        return parseFloat(b.rating || '0') - parseFloat(a.rating || '0');
      default:
        return 0;
    }
  });

  const getCategoryIcon = (categoryId: string) => {
    switch (categoryId) {
      case "phones": return <Smartphone className="h-8 w-8" />;
      case "laptops": return <Laptop className="h-8 w-8" />;
      case "desktops": return <Monitor className="h-8 w-8" />;
      case "accessories": return <Headphones className="h-8 w-8" />;
      default: return <Smartphone className="h-8 w-8" />;
    }
  };

  const handleCategoryFilter = (category: string) => {
    setFilters(prev => ({
      ...prev,
      category: prev.category === category ? undefined : category,
    }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-primary/80 rounded-lg p-8 md:p-12 text-primary-foreground mb-12">
        <div className="max-w-3xl">
          <h2 className="text-4xl md:text-5xl font-bold font-lora mb-4">
            Accessible Tech Shopping Made Simple
          </h2>
          <p className="text-lg font-grotesk mb-6 opacity-90">
            Your trusted destination for the latest technology with competitive pricing and flexible options. We're committed to delivering not just premium products, but exceptional customer service every step of the way.
          </p>
          <Button 
            className="bg-secondary text-secondary-foreground font-geist font-semibold hover:bg-secondary/90"
            onClick={() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })}
            data-testid="button-shop-now"
          >
            Shop Now
          </Button>
        </div>
      </section>

      {/* Category Navigation */}
      <section className="bg-card rounded-lg p-6 border border-border mb-12">
        <h3 className="text-2xl font-bold font-lora text-foreground mb-6">Shop by Category</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant="outline"
              className={`group p-6 h-auto flex flex-col items-center text-center space-y-3 transition-colors ${
                filters.category === category.id 
                  ? 'bg-accent border-primary' 
                  : 'hover:bg-accent'
              }`}
              onClick={() => handleCategoryFilter(category.id)}
              data-testid={`button-category-${category.id}`}
            >
              <div className="text-primary group-hover:scale-110 transition-transform">
                {getCategoryIcon(category.id)}
              </div>
              <div>
                <h4 className="font-geist font-semibold text-foreground">{category.name}</h4>
                <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
              </div>
            </Button>
          ))}
        </div>
      </section>

      {/* Browsing History */}
      <BrowsingHistory />

      {/* Products Section */}
      <div id="products" className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <aside className="lg:col-span-1">
          <ProductFiltersComponent filters={filters} onFiltersChange={setFilters} />
        </aside>

        {/* Products Grid */}
        <main className="lg:col-span-3">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold font-lora text-foreground">
              {filters.searchQuery ? `Search results for "${filters.searchQuery}"` : 'Products'}
              {!isLoading && <span className="text-muted-foreground ml-2">({products.length})</span>}
            </h3>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48" data-testid="select-sort">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Sort by: Featured</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-card rounded-lg border border-border p-4 animate-pulse">
                  <div className="aspect-square bg-muted rounded-lg mb-4"></div>
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded mb-4"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-6 w-16 bg-muted rounded"></div>
                    <div className="h-8 w-24 bg-muted rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground text-lg">No products found</div>
              <p className="text-sm text-muted-foreground mt-2">
                Try adjusting your filters or search terms
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {sortedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
