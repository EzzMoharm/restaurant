// store/cart.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartState {
  userId: string | null;
  userCarts: Record<string, CartItem[]>; // Map of userId -> CartItem[]
  items: CartItem[];
  isOpen: boolean; // Controls the UI slide-out
  setUserId: (userId: string | null) => void;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  totalItems: () => number;
  cartTotal: () => number; // Calculates final price
  openCart: () => void;
  closeCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      userId: null,
      userCarts: {},
      items: [],
      isOpen: false,

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
        if (existingItem) {
          newItems = userActiveItems.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          );
        } else {
          newItems = [...userActiveItems, { ...item, quantity: 1 }];
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
      
      totalItems: () => get().items.reduce((total, item) => total + item.quantity, 0),
      
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