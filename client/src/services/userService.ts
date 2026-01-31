import api from './api'
import { User, UserStats } from '../types'

export const userService = {
  async getProfile(): Promise<User> {
    const response = await api.get<User>('/users/profile')
    return response.data
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await api.put<User>('/users/profile', data)
    return response.data
  },

  async getUserStats(): Promise<UserStats> {
    const response = await api.get<UserStats>('/users/stats')
    return response.data
  },
}
