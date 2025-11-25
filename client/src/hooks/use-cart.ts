import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { CartItemWithProduct } from "@/lib/types";

// Generate a persistent guest session ID
const getGuestSessionId = () => {
  let sessionId = localStorage.getItem('guest-session-id');
  if (!sessionId) {
    sessionId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('guest-session-id', sessionId);
  }
  return sessionId;
};

export function useCart() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const sessionId = token ? `user-${token.substring(0, 20)}` : getGuestSessionId();

  const { data: cartItems = [], isLoading } = useQuery<CartItemWithProduct[]>({
    queryKey: ['/api/cart', sessionId],
    queryFn: async () => {
      const headers: Record<string,string> = { 'x-session-id': sessionId };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch('/api/cart', { headers });
      if (!response.ok) throw new Error('Failed to fetch cart');
      return response.json();
    },
  });

  // Listen for logout events to clear cart
  useEffect(() => {
    const handleLogout = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.action === 'logout' && token) {
        // Clear the authenticated user's cart
        const userSessionId = `user-${token.substring(0, 20)}`;
        fetch('/api/cart', {
          method: 'DELETE',
          headers: {
            'x-session-id': userSessionId,
            'Authorization': `Bearer ${token}`
          }
        }).then(() => {
          queryClient.setQueryData(['/api/cart', userSessionId], []);
          queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
        });
      }
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, [queryClient, token]);

  // Transfer guest cart to user cart on login
  useEffect(() => {
    const handleLogin = async (e: Event) => {
      const customEvent = e as CustomEvent;
      const newToken = customEvent.detail?.token;
      
      if (newToken) {
        const guestSessionId = getGuestSessionId();
        const userSessionId = `user-${newToken.substring(0, 20)}`;
        
        // Get guest cart items
        const guestCartResponse = await fetch('/api/cart', {
          headers: { 'x-session-id': guestSessionId }
        });
        
        if (guestCartResponse.ok) {
          const guestCartItems = await guestCartResponse.json();
          
          // Transfer guest cart items to user cart
          if (guestCartItems.length > 0) {
            await fetch('/api/cart/transfer', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${newToken}`,
                'x-session-id': userSessionId
              },
              body: JSON.stringify({
                fromSessionId: guestSessionId,
                toSessionId: userSessionId
              })
            });
            
            // Clear guest cart after transfer
            await fetch('/api/cart', {
              method: 'DELETE',
              headers: { 'x-session-id': guestSessionId }
            });
            
            // Refresh cart data
            queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
          }
        }
      }
    };

    window.addEventListener('auth:login', handleLogin);
    return () => window.removeEventListener('auth:login', handleLogin);
  }, [queryClient]);

  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity = 1 }: { productId: string; quantity?: number }) => {
      const headers: Record<string,string> = { 
        'Content-Type': 'application/json',
        'x-session-id': sessionId
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers,
        body: JSON.stringify({ productId, quantity }),
      });
      if (!response.ok) throw new Error('Failed to add to cart');
      return response.json();
    },
    onMutate: async ({ productId, quantity = 1 }: { productId: string; quantity?: number }) => {
      await queryClient.cancelQueries({ queryKey: ['/api/cart', sessionId] });
      const previous = queryClient.getQueryData<CartItemWithProduct[]>(['/api/cart', sessionId]);

      const optimisticItem = {
        id: `temp-${Date.now()}`,
        sessionId: sessionId,
        productId,
        quantity,
        createdAt: new Date().toISOString(),
        product: undefined as any,
      };

      queryClient.setQueryData(['/api/cart', sessionId], (old: any) => {
        return old ? [...old, optimisticItem] : [optimisticItem];
      });

      return { previous };
    },
    onError: (err, variables, context: any) => {
      if (context?.previous) {
        queryClient.setQueryData(['/api/cart', sessionId], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart', sessionId] });
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const headers: Record<string,string> = { 
        'Content-Type': 'application/json',
        'x-session-id': sessionId
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(`/api/cart/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ quantity }),
      });
      if (!response.ok) throw new Error('Failed to update cart item');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart', sessionId] });
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (id: string) => {
      const headers: Record<string,string> = { 'x-session-id': sessionId };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(`/api/cart/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!response.ok) throw new Error('Failed to remove from cart');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart', sessionId] });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      const headers: Record<string,string> = { 'x-session-id': sessionId };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch('/api/cart', {
        method: 'DELETE',
        headers,
      });
      if (!response.ok) throw new Error('Failed to clear cart');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart', sessionId] });
    },
  });

  const totalAmount = cartItems.reduce((sum, item) => {
    return sum + (item.product ? parseFloat(item.product.price) * item.quantity : 0);
  }, 0);

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return {
    cartItems,
    isLoading,
    totalAmount,
    totalItems,
    isOpen,
    setIsOpen,
    addToCart: addToCartMutation.mutate,
    updateQuantity: updateQuantityMutation.mutate,
    removeFromCart: removeFromCartMutation.mutate,
    clearCart: clearCartMutation.mutate,
    isAddingToCart: addToCartMutation.isPending,
  };
}
