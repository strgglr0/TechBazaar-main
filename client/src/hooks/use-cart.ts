import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
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
  const { token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [guestSessionId] = useState(() => getGuestSessionId());

  const sessionId = token 
    ? `user-${token.substring(0, 20)}` 
    : guestSessionId;

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
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchInterval: false,
  });

  // Listen for logout events to switch to guest cart view (DON'T clear user cart in backend)
  useEffect(() => {
    const handleLogout = (e: Event) => {
      const customEvent = e as CustomEvent;
      const logoutToken = customEvent.detail?.token;
      if (customEvent.detail?.action === 'logout' && logoutToken) {
        const userSessionId = `user-${logoutToken.substring(0, 20)}`;
        // Just clear the local cache - don't delete from backend
        // This allows the user's cart to persist in the backend for next login
        queryClient.setQueryData(['/api/cart', userSessionId], []);
      }
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, [queryClient]);

  // Transfer guest cart to user cart on login and fetch user's existing cart
  useEffect(() => {
    const handleLogin = async (e: Event) => {
      const customEvent = e as CustomEvent;
      const newToken = customEvent.detail?.token;
      
      if (newToken) {
        try {
          const userSessionId = `user-${newToken.substring(0, 20)}`;
          
          // First, check if there are guest cart items to transfer
          const guestCartResponse = await fetch('/api/cart', {
            headers: { 'x-session-id': guestSessionId }
          });
          
          if (guestCartResponse.ok) {
            const guestCartItems = await guestCartResponse.json();
            
            // If there are guest items, transfer them to user cart
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
              
              // Clear guest cart after successful transfer
              await fetch('/api/cart', {
                method: 'DELETE',
                headers: { 'x-session-id': guestSessionId }
              });
            }
          }
          
          // Fetch the user's cart (which now includes transferred items + existing items)
          const userCartResponse = await fetch('/api/cart', {
            headers: {
              'x-session-id': userSessionId,
              'Authorization': `Bearer ${newToken}`
            }
          });
          
          if (userCartResponse.ok) {
            const userCartItems = await userCartResponse.json();
            queryClient.setQueryData(['/api/cart', userSessionId], userCartItems);
          }
        } catch (err) {
          console.error('Failed to transfer cart on login:', err);
        }
      }
    };

    window.addEventListener('auth:login', handleLogin);
    return () => window.removeEventListener('auth:login', handleLogin);
  }, [queryClient, guestSessionId, token]);

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
        credentials: 'include',
        body: JSON.stringify({ productId, quantity }),
      });
      if (!response.ok) throw new Error('Failed to add to cart');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/cart', sessionId], (old: any) => {
        return old ? [...old, data] : [data];
      });
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
        credentials: 'include',
        body: JSON.stringify({ quantity }),
      });
      if (!response.ok) throw new Error('Failed to update cart item');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/cart', sessionId], (old: any) => {
        if (!old) return old;
        return old.map((item: any) => item.id === data.id ? data : item);
      });
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (id: string) => {
      const headers: Record<string,string> = { 'x-session-id': sessionId };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(`/api/cart/${id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to remove from cart');
      return id;
    },
    onSuccess: (removedId) => {
      queryClient.setQueryData(['/api/cart', sessionId], (old: any) => {
        if (!old) return old;
        return old.filter((item: any) => item.id !== removedId);
      });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      const headers: Record<string,string> = { 'x-session-id': sessionId };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch('/api/cart', {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to clear cart');
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/cart', sessionId], []);
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
