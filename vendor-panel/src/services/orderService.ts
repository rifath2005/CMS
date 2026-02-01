import api from './api'
import { Order, CombinedItem } from '../types'
import { useAuthStore } from '../store/authStore'

const getVendorId = (): string => {
  const vendorId = useAuthStore.getState().user?.vendorId
  if (!vendorId) {
    throw new Error('Vendor ID not found. Please login again.')
  }
  return vendorId
}

export const orderService = {
  async getActiveOrders(): Promise<Order[]> {
    const vendorId = getVendorId()
    const response = await api.get<{ success: boolean; data: Order[] }>(`/vendor/${vendorId}/active-orders`)
    return response.data.data
  },

  async getCombinedItemList(): Promise<CombinedItem[]> {
    const vendorId = getVendorId()
    const response = await api.get<{ success: boolean; data: CombinedItem[] }>(`/vendor/${vendorId}/combined-items`)
    return response.data.data
  },

  async getOrderById(orderId: string): Promise<Order> {
    const response = await api.get<{ success: boolean; data: Order }>(`/vendor/order/${orderId}/detail`)
    return response.data.data
  },

  async verifyQRCode(qrData: string): Promise<{ orderId: string; isValid: boolean }> {
    const response = await api.post<{ success: boolean; data: { orderId: string; isValid: boolean } }>('/vendor/verify-qr', {
      qrData,
    })
    return response.data.data
  },

  async confirmDelivery(orderId: string): Promise<void> {
    await api.post(`/vendor/orders/${orderId}/deliver`)
  },
}
