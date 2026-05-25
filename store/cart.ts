// store/cart.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  customization?: {
    productId?: string;
    baseName?: string;
    basePrice?: number;
    image_url?: string;
    categoryName?: string;
    size?: string;
    addons?: string[];
    instructions?: string;
  };
}

export interface CartProduct {
  id: string;
  name: string;
  price: number;
  category_id?: string;
  image_url: string;
  categoryName?: string;
  categories?: {
    name: string;
  } | null;
}

interface CartState {
  userId: string | null;
  userCarts: Record<string, CartItem[]>; // Map of userId -> CartItem[]
  items: CartItem[];
  isOpen: boolean; // Controls the UI slide-out
  editingItem: CartItem | null;
  customizingProduct: CartProduct | null;
  setUserId: (userId: string | null) => void;
  addItem: (item: CartItem) => void;
  updateItem: (id: string, updatedItem: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  totalItems: () => number;
  cartTotal: () => number; // Calculates final price
  openCart: () => void;
  closeCart: () => void;
  setEditingItem: (item: CartItem | null) => void;
  setCustomizingProduct: (product: CartProduct | null) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      userId: null,
      userCarts: {},
      items: [],
      isOpen: false,
      editingItem: null,
      customizingProduct: null,

      setUserId: (userId) => set((state) => {
        const activeItems = userId ? (state.userCarts[userId] || []) : [];
        return {
          userId,
          items: activeItems
        };
      }),
      
      addItem: (item) => set((state) => {
        const currentUserId = state.userId;
        if (!currentUserId) return {}; // Prevent modifications if not authenticated

        const userActiveItems = state.userCarts[currentUserId] || [];
        const existingItem = userActiveItems.find((i) => i.id === item.id);
        
        let newItems: CartItem[];
        const qtyToAdd = item.quantity || 1;
        if (existingItem) {
          newItems = userActiveItems.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + qtyToAdd } : i
          );
        } else {
          newItems = [...userActiveItems, { ...item, quantity: qtyToAdd }];
        }

        return {
          items: newItems,
          userCarts: {
            ...state.userCarts,
            [currentUserId]: newItems
          }
        };
      }),
      
      removeItem: (id) => set((state) => {
        const currentUserId = state.userId;
        if (!currentUserId) return {};

        const userActiveItems = state.userCarts[currentUserId] || [];
        const newItems = userActiveItems.filter((i) => i.id !== id);

        return {
          items: newItems,
          userCarts: {
            ...state.userCarts,
            [currentUserId]: newItems
          }
        };
      }),
      
      clearCart: () => set((state) => {
        const currentUserId = state.userId;
        if (!currentUserId) return { items: [] };

        return {
          items: [],
          userCarts: {
            ...state.userCarts,
            [currentUserId]: []
          }
        };
      }),
      
      updateItem: (id, updatedItem) => set((state) => {
        const currentUserId = state.userId;
        if (!currentUserId) return {};

        const userActiveItems = state.userCarts[currentUserId] || [];
        let newItems: CartItem[];
        
        if (id === updatedItem.id) {
          newItems = userActiveItems.map((i) => i.id === id ? updatedItem : i);
        } else {
          const filtered = userActiveItems.filter((i) => i.id !== id);
          const existing = filtered.find((i) => i.id === updatedItem.id);
          if (existing) {
            newItems = filtered.map((i) =>
              i.id === updatedItem.id ? { ...i, quantity: i.quantity + updatedItem.quantity } : i
            );
          } else {
            newItems = [...filtered, updatedItem];
          }
        }

        return {
          items: newItems,
          userCarts: {
            ...state.userCarts,
            [currentUserId]: newItems
          }
        };
      }),

      setEditingItem: (editingItem) => set({ editingItem }),
      
      setCustomizingProduct: (customizingProduct) => set({ customizingProduct }),
      
      totalItems: () => get().items.length,
      
      cartTotal: () => get().items.reduce((total, item) => total + (item.price * item.quantity), 0),
      
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
    }),
    {
      name: 'biteflow-cart-storage-v2',
      // Persist the userCarts map, active items, and userId
      partialize: (state) => ({ 
        userCarts: state.userCarts, 
        items: state.items,
        userId: state.userId
      }), 
    }
  )
);