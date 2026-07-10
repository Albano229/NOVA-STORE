"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartStoreItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  currency: string;
  image: string;
  shopId: string;
  shopName: string;
  quantity: number;
  stock: number;
  requiresShippingAddress?: boolean;
  selectedOptions?: Record<string, string>;
}

interface CartState {
  items: CartStoreItem[];
  _synced: boolean;
  addItem: (item: Omit<CartStoreItem, "quantity" | "currency"> & { quantity?: number; currency?: string }) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  getVendorGroups: () => Record<string, CartStoreItem[]>;
  loadFromServer: (items: CartStoreItem[]) => void;
  syncToServer: (item: CartStoreItem, action: "add" | "update" | "remove" | "clear") => void;
}

const syncToAPI = async (item: CartStoreItem, action: "add" | "update" | "remove" | "clear") => {
  try {
    if (action === "add") {
      await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: item.productId, variantId: item.variantId, quantity: item.quantity }),
      });
    } else if (action === "update") {
      await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: item.productId, variantId: item.variantId, quantity: item.quantity }),
      });
    } else if (action === "remove") {
      await fetch(`/api/cart?productId=${item.productId}&variantId=${item.variantId || ""}`, { method: "DELETE" });
    } else if (action === "clear") {
      await fetch("/api/cart", { method: "DELETE" });
    }
  } catch (err) {
    console.error("Cart sync error:", err);
  }
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      _synced: false,

      addItem: (item) => {
        set((state) => {
          const key = item.variantId ? `${item.productId}:${item.variantId}` : item.productId;
          const existingItem = state.items.find((i) => {
            const itemKey = i.variantId ? `${i.productId}:${i.variantId}` : i.productId;
            return itemKey === key;
          });
          let newItems: CartStoreItem[];

          if (existingItem) {
            newItems = state.items.map((i) => {
              const itemKey = i.variantId ? `${i.productId}:${i.variantId}` : i.productId;
              return itemKey === key
                ? { ...i, quantity: Math.min(i.quantity + (item.quantity || 1), i.stock) }
                : i;
            });
          } else {
            newItems = [...state.items, { ...item, quantity: item.quantity || 1, currency: item.currency || "XOF" }];
          }

          const updatedItem = newItems.find((i) => {
            const itemKey = i.variantId ? `${i.productId}:${i.variantId}` : i.productId;
            return itemKey === key;
          });
          if (updatedItem) {
            syncToAPI(updatedItem, existingItem ? "update" : "add");
          }

          return { items: newItems };
        });
      },

      removeItem: (productId, variantId) => {
        const key = variantId ? `${productId}:${variantId}` : productId;
        const item = get().items.find((i) => {
          const itemKey = i.variantId ? `${i.productId}:${i.variantId}` : i.productId;
          return itemKey === key;
        });
        if (item) syncToAPI(item, "remove");
        set((state) => ({
          items: state.items.filter((i) => {
            const itemKey = i.variantId ? `${i.productId}:${i.variantId}` : i.productId;
            return itemKey !== key;
          }),
        }));
      },

      updateQuantity: (productId, quantity, variantId) => {
        const key = variantId ? `${productId}:${variantId}` : productId;
        set((state) => {
          const newItems = state.items.map((i) => {
            const itemKey = i.variantId ? `${i.productId}:${i.variantId}` : i.productId;
            return itemKey === key ? { ...i, quantity: Math.min(quantity, i.stock) } : i;
          });
          const updatedItem = newItems.find((i) => {
            const itemKey = i.variantId ? `${i.productId}:${i.variantId}` : i.productId;
            return itemKey === key;
          });
          if (updatedItem) {
            syncToAPI(updatedItem, quantity <= 0 ? "remove" : "update");
          }
          return {
            items: quantity <= 0 ? newItems.filter((i) => {
              const itemKey = i.variantId ? `${i.productId}:${i.variantId}` : i.productId;
              return itemKey !== key;
            }) : newItems,
          };
        });
      },

      clearCart: () => {
        syncToAPI({} as CartStoreItem, "clear");
        set({ items: [] });
      },

      getTotal: () => {
        return get().items.reduce((total, item) => total + item.price * item.quantity, 0);
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },

      getVendorGroups: () => {
        return get().items.reduce(
          (groups, item) => {
            const key = item.shopId;
            if (!groups[key]) groups[key] = [];
            groups[key].push(item);
            return groups;
          },
          {} as Record<string, CartStoreItem[]>
        );
      },

      loadFromServer: (items) => {
        set((state) => {
          if (state._synced) return state;

          const localItems = state.items;
          const merged = [...items];

          for (const local of localItems) {
            const key = local.variantId ? `${local.productId}:${local.variantId}` : local.productId;
            const exists = merged.find((m) => {
              const mKey = m.variantId ? `${m.productId}:${m.variantId}` : m.productId;
              return mKey === key;
            });
            if (!exists) {
              merged.push(local);
            } else {
              exists.quantity = Math.max(exists.quantity, local.quantity);
            }
          }

          for (const item of merged) {
            syncToAPI(item, "add");
          }

          return { items: merged, _synced: true };
        });
      },

      syncToServer: (item, action) => {
        syncToAPI(item, action);
      },
    }),
    { name: "nova-cart" }
  )
);
