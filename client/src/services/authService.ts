import api from './api'
import { AuthToken, User } from '../types'

export const authService = {
  async register(email: string, password: string, name: string): Promise<AuthToken> {
    const response = await api.post<AuthToken>('/auth/register', {
      email,
      password,
      name,
    })
    return response.data
  },

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

  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/auth/me')
    return response.data
  },
}
