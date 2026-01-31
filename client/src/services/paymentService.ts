import api from './api'
import { Payment, PaymentStatus } from '../types'

export interface PaymentIntent {
  payment: {
    id: string
    userId: string
    amount: number
    status: string
    createdAt: string
  }
  upiLink: string
  qrCode: string
  expiresAt: string
}

export const paymentService = {
  async initiatePayment(userId: string, amount: number): Promise<PaymentIntent> {
    const response = await api.post('/payments/initiate', {
      userId,
      amount,
    })
    return response.data.data
  },

  async verifyPayment(paymentId: string): Promise<PaymentStatus> {
    const response = await api.get(`/payments/${paymentId}/verify`)
    return response.data.data.status
  },

  async getPaymentDetails(paymentId: string): Promise<Payment> {
    const response = await api.get(`/payments/${paymentId}`)
    return response.data.data
  },

  async getUserPayments(userId: string): Promise<Payment[]> {
    const response = await api.get(`/payments/user/${userId}`)
    return response.data.data
  },
}
