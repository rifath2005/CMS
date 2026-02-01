import api from './api'
import { Product } from '../types'
import { useAuthStore } from '../store/authStore'

const getVendorId = (): string => {
  const vendorId = useAuthStore.getState().user?.vendorId
  if (!vendorId) {
    throw new Error('Vendor ID not found. Please login again.')
  }
  return vendorId
}

export const productService = {
  async getVendorProducts(): Promise<Product[]> {
    const vendorId = getVendorId()
    const response = await api.get<{ success: boolean; data: Product[] }>(`/products/vendor/${vendorId}`)
    return response.data.data
  },

  async createProduct(data: Partial<Product>): Promise<Product> {
    const vendorId = getVendorId()
    const response = await api.post<{ success: boolean; data: Product }>('/products', {
      ...data,
      vendorId
    })
    return response.data.data
  },

  async updateProduct(productId: string, data: Partial<Product>): Promise<Product> {
    const response = await api.put<{ success: boolean; data: Product }>(`/products/${productId}`, data)
    return response.data.data
  },

  async deleteProduct(productId: string): Promise<void> {
    await api.delete(`/products/${productId}`)
  },

  async updateStock(productId: string, quantity: number): Promise<void> {
    await api.patch(`/products/${productId}/stock`, { quantity })
  },
}
