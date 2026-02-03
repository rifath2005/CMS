import api from './api'
import { Product } from '../types'

export const productService = {
  async getProducts(institutionId?: string): Promise<Product[]> {
    // If no institutionId provided, try to get from user's auth state
    // For now, default to institution 1 or fetch from user profile
    const instId = institutionId || '11111111-1111-1111-1111-111111111111'
    const response = await api.get<{ success: boolean; data: Product[] }>(`/products/institution/${instId}`)
    return response.data.data
  },

  async getProductById(id: string): Promise<Product> {
    const response = await api.get<{ success: boolean; data: Product }>(`/products/${id}`)
    return response.data.data
  },

  async getProductsByCategory(category: string, institutionId?: string): Promise<Product[]> {
    const instId = institutionId || '11111111-1111-1111-1111-111111111111'
    const response = await api.get<{ success: boolean; data: Product[] }>(`/products/institution/${instId}?category=${category}`)
    return response.data.data
  },

  async getProductsByVendor(vendorId: string, availableOnly: boolean = true): Promise<Product[]> {
    const response = await api.get<{ success: boolean; data: Product[] }>(`/products/vendor/${vendorId}?availableOnly=${availableOnly}`)
    return response.data.data
  },

  async getProductsByCanteen(canteenId: number, availableOnly: boolean = true): Promise<Product[]> {
    const response = await api.get<{ success: boolean; data: Product[] }>(`/products/canteen/${canteenId}?availableOnly=${availableOnly}`)
    return response.data.data
  },
}
