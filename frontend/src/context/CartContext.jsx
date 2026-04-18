import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState({ items: [], summary: { item_count: 0, subtotal: 0 } });
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) {
      setCart({ items: [], summary: { item_count: 0, subtotal: 0 } });
      return;
    }
    setLoading(true);
    try {
      const data = await api.cart.get();
      setCart(data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addToCart = useCallback(async (product_id, variant_id, quantity = 1) => {
    await api.cart.add({ product_id, variant_id, quantity });
    await fetchCart();
  }, [fetchCart]);

  const updateQuantity = useCallback(async (id, quantity) => {
    await api.cart.update(id, quantity);
    await fetchCart();
  }, [fetchCart]);

  const removeItem = useCallback(async (id) => {
    await api.cart.remove(id);
    await fetchCart();
  }, [fetchCart]);

  const clearCart = useCallback(async () => {
    await api.cart.clear();
    await fetchCart();
  }, [fetchCart]);

  return (
    <CartContext.Provider value={{ cart, loading, addToCart, updateQuantity, removeItem, clearCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
