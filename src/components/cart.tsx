"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { trackAddToCart } from "@/lib/analytics";
import type { Material } from "@/lib/types";

export type CartLine = {
  product_id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  material: Material;
  kind: string;
  stock: number;
  qty: number;
};

type CartState = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  ready: boolean;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (line: Omit<CartLine, "qty">, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartState | null>(null);
const KEY = "ansh-arte-bag-v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restore saved bag after hydration
      if (raw) setLines(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {}
  }, [lines, ready]);

  const add = useCallback((line: Omit<CartLine, "qty">, qty = 1) => {
    setLines((prev) => {
      const found = prev.find((l) => l.product_id === line.product_id);
      if (found) {
        return prev.map((l) =>
          l.product_id === line.product_id
            ? { ...l, ...line, qty: Math.min(l.qty + qty, Math.max(line.stock, 1), 10) }
            : l,
        );
      }
      return [...prev, { ...line, qty: Math.min(qty, Math.max(line.stock, 1), 10) }];
    });
    trackAddToCart(line, qty);
    setOpen(true);
  }, []);

  const setQty = useCallback((productId: string, qty: number) => {
    setLines((prev) =>
      prev.map((l) =>
        l.product_id === productId ? { ...l, qty: Math.max(1, Math.min(qty, l.stock || 1, 10)) } : l,
      ),
    );
  }, []);

  const remove = useCallback((productId: string) => {
    setLines((prev) => prev.filter((l) => l.product_id !== productId));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartState>(
    () => ({
      lines,
      ready,
      open,
      setOpen,
      add,
      setQty,
      remove,
      clear,
      count: lines.reduce((n, l) => n + l.qty, 0),
      subtotal: lines.reduce((n, l) => n + l.qty * l.price, 0),
    }),
    [lines, ready, open, add, setQty, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
