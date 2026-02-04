import api from './api';
import { CartItem } from '../types';

export interface WalletBalance {
  balance: number;
  currency: string;
}

export interface AddCashResult {
  success: boolean;
  newBalance: number;
  amountAdded: number;
  message: string;
}

export interface WalletPaymentResult {
  success: boolean;
  orderId: string;
  amountPaid: number;
  newBalance: number;
  message: string;
  qrCode: string;
  validationToken: string;
  expiresAt: string;
}

export interface WalletTransaction {
  order_id: string;
  amount: number;
  status: string;
  timestamp: string;
  type: string;
}

export const walletService = {
  /**
   * Get user's wallet balance
   */
  async getBalance(): Promise<WalletBalance> {
    const response = await api.get<{ success: boolean; data: WalletBalance }>('/wallet/balance');
    return response.data.data;
  },

  /**
   * Add cash to wallet
   */
  async addCash(userId: string, amount: number): Promise<AddCashResult> {
    const response = await api.post<{ success: boolean; data: AddCashResult }>('/wallet/add-cash', {
      userId,
      amount,
    });
    return response.data.data;
  },

  /**
   * Process wallet payment
   */
  async processPayment(cartItems: CartItem[], totalAmount: number): Promise<WalletPaymentResult> {
    const response = await api.post<{ success: boolean; data: WalletPaymentResult }>('/wallet/pay', {
      cartItems,
      totalAmount,
    });
    return response.data.data;
  },

  /**
   * Get wallet transaction history
   */
  async getTransactions(limit: number = 50): Promise<WalletTransaction[]> {
    const response = await api.get<{ success: boolean; data: WalletTransaction[] }>(
      `/wallet/transactions?limit=${limit}`
    );
    return response.data.data;
  },

  /**
   * Refund order to wallet
   */
  async refundOrder(orderId: string): Promise<void> {
    await api.post(`/wallet/refund/${orderId}`);
  },
};
