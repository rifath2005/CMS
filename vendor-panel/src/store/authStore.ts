import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User, AuthToken } from '../types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (authData: AuthToken) => void
  logout: () => void
  updateUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (authData: AuthToken) => {
        set({
          user: authData.user,
          token: authData.token,
          isAuthenticated: true,
        })
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })
      },

      updateUser: (user: User) => {
        set({ user })
      },
    }),
    {
      name: 'vendor-auth-storage',
    }
  )
)
