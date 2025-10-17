import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiFetch } from "@/lib/api";

export default function Login() {
  const [, setLocation] = useLocation();
  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const { login } = useAuth();

  const handleChange = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!form.email?.trim()) {
      toast({ title: 'Error', description: 'Please enter your email', variant: 'destructive' });
      return;
    }
    if (!form.password) {
      toast({ title: 'Error', description: 'Please enter your password', variant: 'destructive' });
      return;
    }
    
    setLoading(true);
    try {
      const { res, data } = await apiFetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });

      if (!res.ok) {
        const errMsg = data?.error || (typeof data === 'string' ? data : 'Login failed');
        throw new Error(errMsg);
      }

      const token = data?.token ?? null;
      const user = data?.user ?? null;
      if (!token || !user) {
        throw new Error('Invalid server response');
      }

      login(token, user);
      toast({ title: 'Signed in', description: `Welcome back ${user.name || ''}` });
      setLocation('/');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Login failed', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="bg-card border border-border rounded-lg p-8">
        <h1 className="text-2xl font-lora font-bold mb-2">Sign in to your account</h1>
        <p className="text-sm text-muted-foreground mb-6">Welcome back — sign in to access your account and orders.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <label className="text-sm font-medium text-foreground block mb-1">Password *</label>
            <Input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="••••••••"
              required
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
            <label className="flex items-center space-x-2">
              <Checkbox checked={form.remember} onCheckedChange={(v) => handleChange('remember', !!v)} />
              <span className="text-sm text-foreground">Remember me</span>
            </label>

            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">Forgot password?</Link>
          </div>

          <div className="flex items-center justify-between">
            <Button type="submit" className="bg-primary text-primary-foreground" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</Button>
            <div className="text-sm">
              <span className="text-muted-foreground">New here?</span>
              <Link href="/signup" className="ml-2 text-primary hover:underline">Create account</Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
