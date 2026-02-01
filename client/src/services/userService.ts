import api from './api'
import { User, UserStats } from '../types'

export const userService = {
  async getProfile(userId: string): Promise<User> {
    const response = await api.get<{ success: boolean; data: User }>(`/profile/${userId}`)
    return response.data.data
  },

  async updateProfile(userId: string, data: Partial<User>): Promise<User> {
    const response = await api.put<{ success: boolean; data: User }>(`/profile/${userId}`, data)
    return response.data.data
  },

  async getUserStats(userId: string): Promise<UserStats> {
    const response = await api.get<{ success: boolean; data: UserStats }>(`/profile/${userId}/statistics`)
    return response.data.data
  },
}
