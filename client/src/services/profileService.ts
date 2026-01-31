import api from './api'

export interface UserProfile {
  id: string
  email: string
  name: string
  role: string
  institutionId: string
  institutionName: string
  createdAt: string
}

export interface UserDashboard {
  profile: UserProfile
  activeOrders: {
    orderId: string
    vendorName: string
    totalAmount: number
    status: string
    remainingTime?: number
  }[]
  statistics: {
    totalOrders: number
    totalSpent: number
    activeOrdersCount: number
  }
}

export interface UserStatistics {
  totalOrders: number
  totalSpent: number
  averageOrderValue: number
  activeOrdersCount: number
}

export const profileService = {
  async getProfile(userId: string): Promise<UserProfile> {
    const response = await api.get(`/profile/${userId}`)
    return response.data.data
  },

  async getDashboard(userId: string): Promise<UserDashboard> {
    const response = await api.get(`/profile/${userId}/dashboard`)
    return response.data.data
  },

  async updateProfile(userId: string, data: { name?: string }): Promise<UserProfile> {
    const response = await api.put(`/profile/${userId}`, data)
    return response.data.data
  },

  async getStatistics(userId: string): Promise<UserStatistics> {
    const response = await api.get(`/profile/${userId}/statistics`)
    return response.data.data
  }
}
