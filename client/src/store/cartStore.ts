import { create } from 'zustand'
import { CartItem } from '../types'

interface CartState {
  items: CartItem[]
  currentUserId: string | null
  addItem: (item: CartItem) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getTotalAmount: () => number
  getTotalItems: () => number
  getCanteenId: () => string | null
  getCanteenName: () => string | null
  loadCart: (userId: string) => void
  setCurrentUserId: (userId: string | null) => void
}

// Helper to get storage key for a user
const getCartStorageKey = (userId: string): string => {
  return `cart-storage-${userId}`
}

// Helper to load cart from localStorage
const loadCartFromStorage = (userId: string): CartItem[] => {
  try {
    const key = getCartStorageKey(userId)
    const stored = localStorage.getItem(key)
    if (stored) {
      const data = JSON.parse(stored)
      return data.items || []
    }
  } catch (error) {
    console.error('Error loading cart:', error)
  }
  return []
}

// Helper to save cart to localStorage
const saveCartToStorage = (userId: string, items: CartItem[]) => {
  try {
    const key = getCartStorageKey(userId)
    localStorage.setItem(key, JSON.stringify({ items, timestamp: Date.now() }))
  } catch (error) {
    console.error('Error saving cart:', error)
  }
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  currentUserId: null,

  addItem: (item: CartItem) => {
    set((state) => {
      // Check if cart has items from a different canteen
      if (state.items.length > 0 && state.items[0].canteenId !== item.canteenId) {
        console.warn('Cannot add items from different canteens')
        return state
      }

      const existingItem = state.items.find((i) => i.productId === item.productId)
      
      let newItems: CartItem[]
      if (existingItem) {
        newItems = state.items.map((i) =>
          i.productId === item.productId
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        )
      } else {
        newItems = [...state.items, item]
      }
      
      // Auto-save to localStorage
      if (state.currentUserId) {
        saveCartToStorage(state.currentUserId, newItems)
      }
      
      return { items: newItems }
    })
  },

  removeItem: (productId: string) => {
    set((state) => {
      const newItems = state.items.filter((item) => item.productId !== productId)
      
      // Auto-save to localStorage
      if (state.currentUserId) {
        saveCartToStorage(state.currentUserId, newItems)
      }
      
      return { items: newItems }
    })
  },

  updateQuantity: (productId: string, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(productId)
      return
    }
    
    set((state) => {
      const newItems = state.items.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
      
      // Auto-save to localStorage
      if (state.currentUserId) {
        saveCartToStorage(state.currentUserId, newItems)
      }
      
      return { items: newItems }
    })
  },

  clearCart: () => {
    set((state) => {
      // Auto-save to localStorage
      if (state.currentUserId) {
        saveCartToStorage(state.currentUserId, [])
      }
      
      return { items: [] }
    })
  },

  getTotalAmount: () => {
    return get().items.reduce((total, item) => total + item.price * item.quantity, 0)
  },

  getTotalItems: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0)
  },

  getCanteenId: () => {
    const items = get().items
    return items.length > 0 ? items[0].canteenId : null
  },

  getCanteenName: () => {
    const items = get().items
    return items.length > 0 ? items[0].canteenName : null
  },

  loadCart: (userId: string) => {
    const items = loadCartFromStorage(userId)
    set({ items, currentUserId: userId })
  },

  setCurrentUserId: (userId: string | null) => {
    if (userId) {
      // Load cart for this user
      const items = loadCartFromStorage(userId)
      set({ currentUserId: userId, items })
    } else {
      // Clear cart when logging out
      set({ currentUserId: null, items: [] })
    }
  },
}))
