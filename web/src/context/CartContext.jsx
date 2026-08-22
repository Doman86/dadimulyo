import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'cart_items';

// Ambang batas grosir harus sama dengan backend (OrderController::BULK_THRESHOLD_KG).
export const BULK_THRESHOLD_KG = 50;

const CartContext = createContext(null);

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function addItem(product, quantityKg) {
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product_id === product.id ? { ...i, quantity_kg: i.quantity_kg + quantityKg } : i
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          name: product.name,
          image_url: product.images?.[0]?.image_url || null,
          price_per_kg: Number(product.price_per_kg || 0),
          wholesale_price: product.wholesale_price != null ? Number(product.wholesale_price) : null,
          minimum_order_kg: Number(product.minimum_order_kg || 1),
          stock_kg: Number(product.stock_kg || 0),
          quantity_kg: quantityKg,
        },
      ];
    });
  }

  function setQuantity(productId, quantityKg) {
    setItems((prev) =>
      prev
        .map((i) => (i.product_id === productId ? { ...i, quantity_kg: quantityKg } : i))
        .filter((i) => i.quantity_kg > 0)
    );
  }

  function removeItem(productId) {
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
  }

  function clearCart() {
    setItems([]);
  }

  // Harga per kg yang berlaku (grosir otomatis untuk qty >= ambang batas).
  function effectivePrice(item) {
    return item.quantity_kg >= BULK_THRESHOLD_KG && item.wholesale_price != null
      ? item.wholesale_price
      : item.price_per_kg;
  }

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + effectivePrice(item) * item.quantity_kg, 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items]
  );

  const count = useMemo(() => items.reduce((sum, i) => sum + i.quantity_kg, 0), [items]);

  return (
    <CartContext.Provider
      value={{ items, count, subtotal, addItem, setQuantity, removeItem, clearCart, effectivePrice }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
