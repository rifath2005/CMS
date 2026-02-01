import api from './api'
import { AuthToken } from '../types'

export const authService = {
  async login(email: string, password: string): Promise<AuthToken> {
    const response = await api.post<{ success: boolean; data: AuthToken }>('/auth/login', {
      email,
      password,
    })
    return response.data.data
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout')
  },
}
