import api from './api'
import { Order, DigitalBill, CartItem } from '../types'

export const orderService = {
  async createOrder(cartItems: CartItem[], paymentId: string): Promise<Order> {
    const response = await api.post<Order>('/orders', {
      items: cartItems,
      paymentId,
    })
    return response.data
  },

  async getOrderById(orderId: string): Promise<Order> {
    const response = await api.get<Order>(`/orders/${orderId}`)
    return response.data
  },

  async getActiveOrders(): Promise<Order[]> {
    const response = await api.get<Order[]>('/orders/active')
    return response.data
  },

  async getOrderHistory(filters?: { startDate?: string; endDate?: string; vendorId?: string }): Promise<Order[]> {
    const params = new URLSearchParams()
    if (filters?.startDate) params.append('startDate', filters.startDate)
    if (filters?.endDate) params.append('endDate', filters.endDate)
    if (filters?.vendorId) params.append('vendorId', filters.vendorId)
    
    const response = await api.get<Order[]>(`/orders/history?${params.toString()}`)
    return response.data
  },

  async getBillByOrderId(orderId: string): Promise<DigitalBill> {
    const response = await api.get<DigitalBill>(`/bills/order/${orderId}`)
    return response.data
  },
}
