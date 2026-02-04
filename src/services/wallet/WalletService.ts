import { Pool, PoolClient } from 'pg';
import { ValidationError, NotFoundError } from '../../utils/errors';

export interface WalletBalance {
  userId: string;
  balance: number;
  updatedAt: Date;
}

export interface WalletTransaction {
  userId: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  orderId?: string;
  balanceBefore: number;
  balanceAfter: number;
  timestamp: Date;
}

export class WalletService {
  constructor(private pool: Pool) {}

  /**
   * Get user's wallet balance
   */
  async getBalance(userId: string): Promise<number> {
    console.log('🔍 WalletService.getBalance called for userId:', userId);
    
    const result = await this.pool.query(
      `SELECT wallet_balance FROM users WHERE id = $1 AND role = 'USER'`,
      [userId]
    );

    console.log('📊 Query result:', {
      rowCount: result.rows.length,
      row: result.rows[0],
      wallet_balance: result.rows[0]?.wallet_balance,
      type: typeof result.rows[0]?.wallet_balance
    });

    if (result.rows.length === 0) {
      throw new NotFoundError('User not found or not eligible for wallet');
    }

    const balance = parseFloat(result.rows[0].wallet_balance) || 0;
    console.log('💰 Returning balance:', balance);
    
    return balance;
  }

  /**
   * Check if user has sufficient balance
   */
  async hasSufficientBalance(userId: string, amount: number): Promise<boolean> {
    const balance = await this.getBalance(userId);
    return balance >= amount;
  }

  /**
   * Deduct amount from wallet (atomic transaction)
   */
  async deductBalance(
    userId: string,
    amount: number,
    orderId: string,
    client?: PoolClient
  ): Promise<WalletBalance> {
    if (amount <= 0) {
      throw new ValidationError('Amount must be greater than 0');
    }

    const useExistingClient = !!client;
    const dbClient = client || await this.pool.connect();

    try {
      if (!useExistingClient) {
        await dbClient.query('BEGIN');
      }

      // Lock the user row for update
      const balanceResult = await dbClient.query(
        `SELECT wallet_balance FROM users 
         WHERE id = $1 AND role = 'USER' 
         FOR UPDATE`,
        [userId]
      );

      if (balanceResult.rows.length === 0) {
        throw new NotFoundError('User not found or not eligible for wallet');
      }

      const currentBalance = parseFloat(balanceResult.rows[0].wallet_balance) || 0;

      if (currentBalance < amount) {
        throw new ValidationError(
          `Insufficient wallet balance. Available: ₹${currentBalance.toFixed(2)}, Required: ₹${amount.toFixed(2)}`
        );
      }

      const newBalance = currentBalance - amount;

      // Update wallet balance
      const updateResult = await dbClient.query(
        `UPDATE users 
         SET wallet_balance = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 AND role = 'USER'
         RETURNING wallet_balance, updated_at`,
        [newBalance, userId]
      );

      if (!useExistingClient) {
        await dbClient.query('COMMIT');
      }

      return {
        userId,
        balance: parseFloat(updateResult.rows[0].wallet_balance),
        updatedAt: updateResult.rows[0].updated_at,
      };
    } catch (error) {
      if (!useExistingClient) {
        await dbClient.query('ROLLBACK');
      }
      throw error;
    } finally {
      if (!useExistingClient) {
        dbClient.release();
      }
    }
  }

  /**
   * Add amount to wallet (for refunds or credits)
   */
  async creditBalance(
    userId: string,
    amount: number,
    reason: string,
    client?: PoolClient
  ): Promise<WalletBalance> {
    if (amount <= 0) {
      throw new ValidationError('Amount must be greater than 0');
    }

    const useExistingClient = !!client;
    const dbClient = client || await this.pool.connect();

    try {
      if (!useExistingClient) {
        await dbClient.query('BEGIN');
      }

      // Lock the user row for update
      const balanceResult = await dbClient.query(
        `SELECT wallet_balance FROM users 
         WHERE id = $1 AND role = 'USER' 
         FOR UPDATE`,
        [userId]
      );

      if (balanceResult.rows.length === 0) {
        throw new NotFoundError('User not found or not eligible for wallet');
      }

      const currentBalance = parseFloat(balanceResult.rows[0].wallet_balance) || 0;
      const newBalance = currentBalance + amount;

      // Update wallet balance
      const updateResult = await dbClient.query(
        `UPDATE users 
         SET wallet_balance = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 AND role = 'USER'
         RETURNING wallet_balance, updated_at`,
        [newBalance, userId]
      );

      if (!useExistingClient) {
        await dbClient.query('COMMIT');
      }

      return {
        userId,
        balance: parseFloat(updateResult.rows[0].wallet_balance),
        updatedAt: updateResult.rows[0].updated_at,
      };
    } catch (error) {
      if (!useExistingClient) {
        await dbClient.query('ROLLBACK');
      }
      throw error;
    } finally {
      if (!useExistingClient) {
        dbClient.release();
      }
    }
  }

  /**
   * Add cash to wallet (user top-up)
   */
  async addCash(userId: string, amount: number): Promise<number> {
    if (amount <= 0) {
      throw new ValidationError('Amount must be greater than 0');
    }

    if (amount > 1000) {
      throw new ValidationError('Amount cannot exceed ₹1000');
    }

    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Lock the user row for update
      const balanceResult = await client.query(
        `SELECT wallet_balance FROM users 
         WHERE id = $1 AND role = 'USER' 
         FOR UPDATE`,
        [userId]
      );

      if (balanceResult.rows.length === 0) {
        throw new NotFoundError('User not found or not eligible for wallet');
      }

      const currentBalance = parseFloat(balanceResult.rows[0].wallet_balance) || 0;
      const newBalance = currentBalance + amount;

      // Update wallet balance
      const updateResult = await client.query(
        `UPDATE users 
         SET wallet_balance = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 AND role = 'USER'
         RETURNING wallet_balance`,
        [newBalance, userId]
      );

      await client.query('COMMIT');

      return parseFloat(updateResult.rows[0].wallet_balance);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get wallet transaction history (from orders)
   */
  async getTransactionHistory(userId: string, limit: number = 50): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT 
        o.id as order_id,
        o.total_amount as amount,
        o.status,
        o.created_at as timestamp,
        'DEBIT' as type
       FROM orders o
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows;
  }
}
