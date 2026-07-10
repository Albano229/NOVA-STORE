"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CompareProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number | null;
  image?: string;
  shopName: string;
}

interface CompareState {
  items: CompareProduct[];
  maxItems: number;
  addProduct: (product: CompareProduct) => void;
  removeProduct: (productId: string) => void;
  clearAll: () => void;
  isInCompare: (productId: string) => boolean;
}

export const useCompareStore = create<CompareState>()(
  persist(
    (set, get) => ({
      items: [],
      maxItems: 4,

      addProduct: (product) => {
        const { items, maxItems } = get();
        if (items.length >= maxItems) return;
        if (items.some((i) => i.id === product.id)) return;
        set({ items: [...items, product] });
      },

      removeProduct: (productId) => {
        set({ items: get().items.filter((i) => i.id !== productId) });
      },

      clearAll: () => set({ items: [] }),

      isInCompare: (productId) => {
        return get().items.some((i) => i.id === productId);
      },
    }),
    {
      name: "nova-compare",
    }
  )
);
