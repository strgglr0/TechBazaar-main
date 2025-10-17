import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { CartItemWithProduct } from "@/lib/types";

const SESSION_ID = "default-session";

export function useCart() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  // include auth token if present so cart endpoints operate on user cart
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const { data: cartItems = [], isLoading } = useQuery<CartItemWithProduct[]>({
    queryKey: ['/api/cart'],
    queryFn: async () => {
      const headers: Record<string,string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else {
        headers['x-session-id'] = SESSION_ID;
      }
      const response = await fetch('/api/cart', { headers });
      if (!response.ok) throw new Error('Failed to fetch cart');
      return response.json();
    },
  });

  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity = 1 }: { productId: string; quantity?: number }) => {
      const headers: Record<string,string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      else headers['x-session-id'] = SESSION_ID;
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers,
        body: JSON.stringify({ productId, quantity }),
      });
      if (!response.ok) throw new Error('Failed to add to cart');
      return response.json();
    },
    // Optimistic update: add item locally immediately, rollback on error
    onMutate: async ({ productId, quantity = 1 }: { productId: string; quantity?: number }) => {
      await queryClient.cancelQueries({ queryKey: ['/api/cart'] });
      const previous = queryClient.getQueryData<CartItemWithProduct[]>((['/api/cart'] as any));

      // Create an optimistic cart item
      const optimisticItem = {
        id: `temp-${Date.now()}`,
        sessionId: SESSION_ID,
        productId,
        quantity,
        createdAt: new Date().toISOString(),
        product: undefined as any,
      };

      queryClient.setQueryData(['/api/cart'], (old: any) => {
        return old ? [...old, optimisticItem] : [optimisticItem];
      });

      return { previous };
    },
    onError: (err, variables, context: any) => {
      if (context?.previous) {
        queryClient.setQueryData(['/api/cart'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      const headers: Record<string,string> = { 'Content-Type': 'application/json' };
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
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (id: string) => {
      const headers: Record<string,string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      else headers['x-session-id'] = SESSION_ID;
      const response = await fetch(`/api/cart/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!response.ok) throw new Error('Failed to remove from cart');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
    },
  });

  const clearCartMutation = useMutation({
    mutationFn: async () => {
      const headers: Record<string,string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      else headers['x-session-id'] = SESSION_ID;
      const response = await fetch('/api/cart', {
        method: 'DELETE',
        headers,
      });
      if (!response.ok) throw new Error('Failed to clear cart');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/cart'] });
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
