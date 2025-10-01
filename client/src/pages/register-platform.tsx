import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export default function RegisterPlatform() {
  const [form, setForm] = useState({ platformName: '', url: '', category: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Placeholder: call API to register platform
    await new Promise(r => setTimeout(r, 700));
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-card border border-border rounded-lg p-8">
        <h1 className="text-2xl font-lora font-bold mb-2">Register your platform</h1>
        <p className="text-sm text-muted-foreground mb-6">Provide details about your platform to join TechMarket's partner network.</p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-foreground block mb-1">Platform name</label>
            <Input value={form.platformName} onChange={(e) => handleChange('platformName', e.target.value)} placeholder="Acme Electronics" />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Website URL</label>
            <Input value={form.url} onChange={(e) => handleChange('url', e.target.value)} placeholder="https://" />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Category</label>
            <Select value={form.category} onValueChange={(v) => handleChange('category', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Choose category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="phones">Phones</SelectItem>
                <SelectItem value="laptops">Laptops</SelectItem>
                <SelectItem value="desktops">Desktops</SelectItem>
                <SelectItem value="accessories">Accessories</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2 flex items-center justify-end space-x-3 mt-4">
            <Button type="submit" className="bg-primary text-primary-foreground" disabled={loading}>{loading ? 'Registering...' : 'Register platform'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
