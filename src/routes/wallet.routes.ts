import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { WalletService } from '../services/wallet/WalletService';
import { WalletOrderService } from '../services/order/WalletOrderService';
import { authenticate } from '../middleware/auth.middleware';
import { ValidationError } from '../utils/errors';

export const createWalletRouter = (pool: Pool): Router => {
  const router = Router();
  const walletService = new WalletService(pool);
  const walletOrderService = new WalletOrderService(pool);

  // GET /api/v1/wallet/balance - Get user's wallet balance
  router.get('/balance', authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id;

      console.log('🔍 Wallet balance request:', { userId, user: (req as any).user });

      if (!userId) {
        throw new ValidationError('User not authenticated');
      }

      const balance = await walletService.getBalance(userId);
      
      console.log('✅ Wallet balance fetched:', { userId, balance });

      res.json({
        success: true,
        data: {
          balance,
          currency: 'INR',
        },
      });
    } catch (error: any) {
      console.error('❌ Wallet balance error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    }
  });

  // POST /api/v1/wallet/pay - Process wallet payment and create order
  router.post('/pay', authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id;
      const { cartItems, totalAmount } = req.body;

      if (!userId) {
        throw new ValidationError('User not authenticated');
      }

      if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
        throw new ValidationError('Cart items are required');
      }

      if (!totalAmount || totalAmount <= 0) {
        throw new ValidationError('Invalid total amount');
      }

      const result = await walletOrderService.processWalletPayment(
        userId,
        cartItems,
        totalAmount
      );

      res.json({
        success: true,
        data: result,
        message: 'Payment successful! Order placed.',
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'PAYMENT_FAILED',
          message: error.message,
        },
      });
    }
  });

  // GET /api/v1/wallet/transactions - Get wallet transaction history
  router.get('/transactions', authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id;
      const limit = parseInt(req.query.limit as string) || 50;

      if (!userId) {
        throw new ValidationError('User not authenticated');
      }

      const transactions = await walletService.getTransactionHistory(userId, limit);

      res.json({
        success: true,
        data: transactions,
        count: transactions.length,
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'INTERNAL_ERROR',
          message: error.message,
        },
      });
    }
  });

  // POST /api/v1/wallet/refund/:orderId - Refund order to wallet
  router.post('/refund/:orderId', authenticate, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id;
      const { orderId } = req.params;

      if (!userId) {
        throw new ValidationError('User not authenticated');
      }

      await walletOrderService.refundToWallet(orderId, userId);

      res.json({
        success: true,
        message: 'Order refunded to wallet successfully',
      });
    } catch (error: any) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          code: error.code || 'REFUND_FAILED',
          message: error.message,
        },
      });
    }
  });

  return router;
};
