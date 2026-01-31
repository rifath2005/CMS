import api from './api'

export interface DigitalBill {
  id: string
  orderId: string
  userId: string
  userName: string
  vendorId: string
  items: {
    productId: string
    productName: string
    quantity: number
    price: number
    imageUrl?: string
  }[]
  totalAmount: number
  paymentTimestamp: string
  generatedAt: string
  expiresAt: string
  remainingSeconds: number
  isValid: boolean
  isDelivered: boolean
  qrCode: string
  validationToken: string
}

export const billService = {
  async getBillByOrderId(orderId: string): Promise<DigitalBill> {
    const response = await api.get(`/bills/order/${orderId}`)
    return response.data.data
  },

  async checkBillValidity(billId: string): Promise<boolean> {
    const response = await api.get(`/bills/${billId}/valid`)
    return response.data.data.isValid
  },

  async getRemainingTime(billId: string): Promise<number> {
    const response = await api.get(`/bills/${billId}/remaining-time`)
    return response.data.data.remainingSeconds
  },

  async verifyQRCode(qrData: string): Promise<{ 
    isValid: boolean
    billId?: string
    orderId?: string
    errorMessage?: string 
  }> {
    const response = await api.post('/bills/verify-qr', { qrData })
    return response.data.data
  },

  async confirmDelivery(billId: string, validationToken: string): Promise<void> {
    await api.post(`/bills/${billId}/confirm-delivery`, { validationToken })
  }
}
