import api from './api'
import { Product } from '../types'

export const productService = {
  async getProducts(): Promise<Product[]> {
    const response = await api.get<Product[]>('/products')
    return response.data
  },

  async getProductById(id: string): Promise<Product> {
    const response = await api.get<Product>(`/products/${id}`)
    return response.data
  },

  async getProductsByCategory(category: string): Promise<Product[]> {
    const response = await api.get<Product[]>(`/products?category=${category}`)
    return response.data
  },
}
