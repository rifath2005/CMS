import api from './api'
import { Order, DigitalBill, CartItem } from '../types'

export const orderService = {
  async createOrder(userId: string, paymentId: string): Promise<Order> {
    const response = await api.post('/orders', {
      userId,
      paymentId,
    })
    return response.data.data
  },

  async getOrderById(orderId: string): Promise<Order> {
    const response = await api.get(`/orders/${orderId}`)
    return response.data.data
  },

  async getActiveOrders(userId: string): Promise<Order[]> {
    const response = await api.get(`/orders/user/${userId}`)
    return response.data.data
  },

  async getOrderHistory(userId: string, filters?: { startDate?: string; endDate?: string; vendorId?: string }): Promise<Order[]> {
    const params = new URLSearchParams()
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)
    if (filters?.vendorId) params.append('vendorId', filters.vendorId)
    
    const response = await api.get(`/order-history/${userId}?${params.toString()}`)
    return response.data.data
  },

  async getBillByOrderId(orderId: string): Promise<DigitalBill> {
    const response = await api.get(`/bills/order/${orderId}`)
    return response.data.data
  },

  async getRemainingTime(orderId: string): Promise<number> {
    const response = await api.get(`/orders/${orderId}/remaining-time`)
    return response.data.data.remainingSeconds
  },

  async verifyDelivery(orderId: string, validationToken: string): Promise<Order> {
    const response = await api.post(`/orders/${orderId}/verify-delivery`, {
      validationToken
    })
    return response.data.data
  },
}
