import api from './api'
import { Product } from '../types'

export const productService = {
  async getVendorProducts(): Promise<Product[]> {
    const response = await api.get<Product[]>('/vendor/products')
    return response.data
  },

  async createProduct(data: Partial<Product>): Promise<Product> {
    const response = await api.post<Product>('/vendor/products', data)
    return response.data
  },

  async updateProduct(productId: string, data: Partial<Product>): Promise<Product> {
    const response = await api.put<Product>(`/vendor/products/${productId}`, data)
    return response.data
  },

  async deleteProduct(productId: string): Promise<void> {
    await api.delete(`/vendor/products/${productId}`)
  },

  async updateStock(productId: string, quantity: number): Promise<void> {
    await api.patch(`/vendor/products/${productId}/stock`, { quantity })
  },
}
