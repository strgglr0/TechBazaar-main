import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, Link } from "wouter";
import { Search, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ProductCard from "@/components/product-card";
import type { Product } from "@/lib/types";

export default function SearchPage() {
  const [location, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("relevance");

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const query = searchParams.get('q');
    console.debug('[SEARCH] URL:', window.location.href);
    console.debug('[SEARCH] Query param q:', query);
    
    if (query) {
      setSearchQuery(query);
      setLocalSearchQuery(query);
    } else {
      setSearchQuery("");
      setLocalSearchQuery("");
    }
  }, [location]);

  const { data: products = [], isLoading, error } = useQuery<Product[]>({
    queryKey: ['search-products', searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) {
        console.debug('[SEARCH] Empty query, returning []');
        return [];
      }
      
      const url = `/api/products?search=${encodeURIComponent(searchQuery)}`;
      console.debug('[SEARCH] Fetching URL:', url);
      
      const response = await fetch(url);
      if (!response.ok) {
        console.error('[SEARCH] API error:', response.status, response.statusText);
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.debug('[SEARCH] RESULTS:', data.length);
      console.debug('[SEARCH] Data:', data);
      return data;
    },
    enabled: !!searchQuery,
    refetchOnWindowFocus: false,
    staleTime: 10000,
  });

  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return parseFloat(a.price) - parseFloat(b.price);
      case "price-high":
        return parseFloat(b.price) - parseFloat(a.price);
      case "rating":
        return parseFloat(b.rating || '0') - parseFloat(a.rating || '0');
      case "name":
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = localSearchQuery.trim();
    if (trimmed) {
      console.debug('[SEARCH] Navigating to:', `/search?q=${trimmed}`);
      setLocation(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold font-lora text-foreground mb-4">
            Search Products
          </h1>
          
          <form onSubmit={handleSearch} className="flex gap-2 mb-6">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Search for phones, laptops, accessories..."
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                className="pl-10 h-12 text-base"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            </div>
            <Button type="submit" className="h-12 px-8">
              Search
            </Button>
          </form>

          {searchQuery && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-lg font-geist">
                  {isLoading ? (
                    <span className="text-muted-foreground">Searching...</span>
                  ) : (
                    <>
                      <span className="font-semibold">{products.length}</span>{" "}
                      {products.length === 1 ? "result" : "results"} found for{" "}
                      <span className="font-semibold">"{searchQuery}"</span>
                    </>
                  )}
                </p>
              </div>

              {products.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Sort by:</span>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="name">Name (A-Z)</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}
        </div>

        {error ? (
          <div className="text-center py-16">
            <div className="bg-destructive/10 text-destructive rounded-lg p-6 mb-4">
              <h3 className="text-xl font-semibold mb-2">Search Error</h3>
              <p>Failed to fetch products. Please try again.</p>
              <p className="text-sm mt-2">{String(error)}</p>
            </div>
          </div>
        ) : !searchQuery ? (
          <div className="text-center py-16">
            <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold font-geist mb-2">Start Your Search</h3>
            <p className="text-muted-foreground">
              Enter keywords to find products you're looking for
            </p>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted rounded-lg h-80"></div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="bg-muted rounded-full h-32 w-32 mx-auto mb-6 flex items-center justify-center">
              <Search className="h-16 w-16 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-bold font-lora mb-2">No Products Found</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              We couldn't find any products matching "{searchQuery}". Try searching with different keywords or browse our categories.
            </p>
            <Link href="/">
              <Button>Browse All Products</Button>
            </Link>
          </div>
        )}

        {searchQuery && products.length === 0 && !isLoading && (
          <div className="mt-12 bg-muted/50 rounded-lg p-6">
            <h4 className="font-semibold font-geist mb-3">Search Tips:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Try different keywords (e.g., "iPhone" instead of "Apple phone")</li>
              <li>• Check your spelling</li>
              <li>• Use more general terms (e.g., "laptop" instead of specific model)</li>
              <li>• Try searching by brand (Apple, Samsung, Dell, etc.)</li>
              <li>• Browse by category instead</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
