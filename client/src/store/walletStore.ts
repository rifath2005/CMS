import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WalletState {
  balance: number
  lastFetched: number | null
  setBalance: (balance: number) => void
  updateBalance: (newBalance: number) => void
  clearBalance: () => void
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      balance: 0,
      lastFetched: null,

      setBalance: (balance: number) => {
        set({ balance, lastFetched: Date.now() })
      },

      updateBalance: (newBalance: number) => {
        set({ balance: newBalance, lastFetched: Date.now() })
      },

      clearBalance: () => {
        set({ balance: 0, lastFetched: null })
      },
    }),
    {
      name: 'wallet-storage',
    }
  )
)
