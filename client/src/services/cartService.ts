import api from './api'

export interface CartItem {
  productId: string
  productName: string
  quantity: number
  price: number
  imageUrl?: string
  vendorId: string
}

export interface Cart {
  userId: string
  items: CartItem[]
  totalAmount: number
  vendorId?: string
}

export const cartService = {
  async getCart(userId: string): Promise<Cart> {
    const response = await api.get(`/cart/${userId}`)
    return response.data.data
  },

  async addItem(userId: string, item: CartItem): Promise<Cart> {
    const response = await api.post('/cart/items', {
      userId,
      ...item
    })
    return response.data.data
  },

  async updateQuantity(userId: string, productId: string, quantity: number): Promise<Cart> {
    const response = await api.put(`/cart/${userId}/items/${productId}`, {
      quantity
    })
    return response.data.data
  },

  async removeItem(userId: string, productId: string): Promise<Cart> {
    const response = await api.delete(`/cart/${userId}/items/${productId}`)
    return response.data.data
  },

  async clearCart(userId: string): Promise<void> {
    await api.delete(`/cart/${userId}`)
  },

  async validateCart(userId: string): Promise<{ valid: boolean; errors: string[] }> {
    const response = await api.get(`/cart/${userId}/validate`)
    return response.data.data
  },

  async getItemCount(userId: string): Promise<number> {
    const response = await api.get(`/cart/${userId}/count`)
    return response.data.data.count
  }
}
