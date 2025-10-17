import { useQuery } from "@tanstack/react-query";
import { Eye } from "lucide-react";
import ProductCard from "./product-card";
import type { Product } from "@/lib/types";

export default function BrowsingHistory() {
  const token = localStorage.getItem('token');
  
  const { data: history = [] } = useQuery<Product[]>({
    queryKey: ['/api/browsing-history'],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      else headers['x-session-id'] = 'default-session';
      
      const response = await fetch('/api/browsing-history?limit=8', { headers });
      if (!response.ok) return [];
      return response.json();
    },
  });

  if (history.length === 0) {
    return null;
  }

  return (
    <section className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <Eye className="h-6 w-6 text-primary" />
        <h3 className="text-2xl font-bold font-lora text-foreground">
          Recently Viewed
        </h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {history.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
