import api from './api'
import { User } from '../types'

export interface LoginResponse {
  user: User
  token: string
}

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', { email, password })
    return response.data
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout')
  },
}
