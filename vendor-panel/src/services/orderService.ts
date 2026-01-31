import api from './api'
import { Order, CombinedItem } from '../types'

export const orderService = {
  async getActiveOrders(): Promise<Order[]> {
    const response = await api.get<Order[]>('/vendor/orders/active')
    return response.data
  },

  async getCombinedItemList(): Promise<CombinedItem[]> {
    const response = await api.get<CombinedItem[]>('/vendor/orders/combined-items')
    return response.data
  },

  async getOrderById(orderId: string): Promise<Order> {
    const response = await api.get<Order>(`/vendor/orders/${orderId}`)
    return response.data
  },

  async verifyQRCode(qrData: string): Promise<{ orderId: string; isValid: boolean }> {
    const response = await api.post<{ orderId: string; isValid: boolean }>('/vendor/verify-qr', {
      qrData,
    })
    return response.data
  },

  async confirmDelivery(orderId: string): Promise<void> {
    await api.post(`/vendor/orders/${orderId}/deliver`)
  },
}
