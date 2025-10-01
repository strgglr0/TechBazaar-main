import { useEffect, useState } from 'react';

type Product = {
  id: string;
  name: string;
  description?: string;
  price?: string;
};

export default function ProductListFromFlask() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        setProducts(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h3 className="font-lora font-bold">Products from Flask</h3>
      <ul>
        {products.map(p => (
          <li key={p.id} className="py-2">
            <div className="font-semibold">{p.name} — ${p.price}</div>
            <div className="text-sm text-muted-foreground">{p.description}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
