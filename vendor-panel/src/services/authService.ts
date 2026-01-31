import api from './api'
import { AuthToken } from '../types'

export const authService = {
  async login(email: string, password: string): Promise<AuthToken> {
    const response = await api.post<AuthToken>('/auth/login', {
      email,
      password,
    })
    return response.data
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout')
  },
}
