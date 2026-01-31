import { create } from 'zustand'
import { User, UserRole } from '../types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (user: User, token: string) => void
  logout: () => void
  isMainAdmin: () => boolean
  isInstitutionAdmin: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),

  login: (user: User, token: string) => {
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('token', token)
    set({ user, token, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    set({ user: null, token: null, isAuthenticated: false })
  },

  isMainAdmin: () => {
    const { user } = get()
    return user?.role === UserRole.MAIN_ADMIN
  },

  isInstitutionAdmin: () => {
    const { user } = get()
    return user?.role === UserRole.INSTITUTION_ADMIN
  },
}))
