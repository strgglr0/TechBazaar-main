import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api";

export default function SignUp() {
  const [, setLocation] = useLocation();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const { login } = useAuth();

  const handleChange = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!form.name?.trim()) {
      toast({ title: 'Error', description: 'Please enter your full name', variant: 'destructive' });
      return;
    }
    if (!form.email?.trim()) {
      toast({ title: 'Error', description: 'Please enter your email', variant: 'destructive' });
      return;
    }
    if (!form.password || form.password.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    
    setLoading(true);
    try {
      const res = await apiFetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to register');
      
      login(data.token, data.user);
      toast({ title: 'Account created', description: 'Welcome!' });
      setLocation('/');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Registration failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="bg-card border border-border rounded-lg p-8">
        <h1 className="text-2xl font-lora font-bold mb-2">Create your account</h1>
        <p className="text-sm text-muted-foreground mb-6">Join TechMarket to get the best deals and manage your orders.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Full name *</label>
            <Input 
              value={form.name} 
              onChange={(e) => handleChange('name', e.target.value)} 
              placeholder="Jane Doe" 
              required 
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1">Email *</label>
            <Input 
              type="email" 
              value={form.email} 
              onChange={(e) => handleChange('email', e.target.value)} 
              placeholder="you@company.com" 
              required 
            />
          </div>

          <div className="relative">
            <label className="text-sm font-medium text-foreground block mb-1">Password * (min 6 characters)</label>
            <Input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(s => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-2 top-9 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <Button type="submit" className="bg-primary text-primary-foreground" disabled={loading}>{loading ? 'Creating...' : 'Sign up'}</Button>
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">Back to home</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
