import api from './api'
import { Payment, PaymentStatus } from '../types'

export interface PaymentIntent {
  paymentId: string
  amount: number
  upiLink: string
}

export const paymentService = {
  async initiatePayment(amount: number): Promise<PaymentIntent> {
    const response = await api.post<PaymentIntent>('/payments/initiate', {
      amount,
    })
    return response.data
  },

  async verifyPayment(paymentId: string): Promise<PaymentStatus> {
    const response = await api.get<{ status: PaymentStatus }>(`/payments/${paymentId}/verify`)
    return response.data.status
  },

  async getPaymentDetails(paymentId: string): Promise<Payment> {
    const response = await api.get<Payment>(`/payments/${paymentId}`)
    return response.data
  },
}
