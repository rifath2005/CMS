import { Pool } from 'pg';

export enum PaymentStatus {
  INITIATED = 'INITIATED',
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  status: PaymentStatus;
  upiTransactionId?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface CreatePaymentData {
  userId: string;
  amount: number;
  status?: PaymentStatus;
  upiTransactionId?: string;
}

export interface UpdatePaymentData {
  status?: PaymentStatus;
  upiTransactionId?: string;
  completedAt?: Date;
}

export class PaymentModel {
  constructor(private pool: Pool) {}

  async create(data: CreatePaymentData): Promise<Payment> {
    const query = `
      INSERT INTO payments (user_id, amount, status, upi_transaction_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, user_id as "userId", amount, status, upi_transaction_id as "upiTransactionId", 
                created_at as "createdAt", completed_at as "completedAt"
    `;
    
    const values = [
      data.userId,
      data.amount,
      data.status || PaymentStatus.INITIATED,
      data.upiTransactionId || null
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async findById(id: string): Promise<Payment | null> {
    const query = `
      SELECT id, user_id as "userId", amount, status, upi_transaction_id as "upiTransactionId",
             created_at as "createdAt", completed_at as "completedAt"
      FROM payments
      WHERE id = $1
    `;

    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async findByUpiTransactionId(upiTransactionId: string): Promise<Payment | null> {
    const query = `
      SELECT id, user_id as "userId", amount, status, upi_transaction_id as "upiTransactionId",
             created_at as "createdAt", completed_at as "completedAt"
      FROM payments
      WHERE upi_transaction_id = $1
    `;

    const result = await this.pool.query(query, [upiTransactionId]);
    return result.rows[0] || null;
  }

  async update(id: string, data: UpdatePaymentData): Promise<Payment | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(data.status);
    }

    if (data.upiTransactionId !== undefined) {
      updates.push(`upi_transaction_id = $${paramCount++}`);
      values.push(data.upiTransactionId);
    }

    if (data.completedAt !== undefined) {
      updates.push(`completed_at = $${paramCount++}`);
      values.push(data.completedAt);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const query = `
      UPDATE payments
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, user_id as "userId", amount, status, upi_transaction_id as "upiTransactionId",
                created_at as "createdAt", completed_at as "completedAt"
    `;

    const result = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  async findByUserId(userId: string): Promise<Payment[]> {
    const query = `
      SELECT id, user_id as "userId", amount, status, upi_transaction_id as "upiTransactionId",
             created_at as "createdAt", completed_at as "completedAt"
      FROM payments
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;

    const result = await this.pool.query(query, [userId]);
    return result.rows;
  }

  async findByStatus(status: PaymentStatus): Promise<Payment[]> {
    const query = `
      SELECT id, user_id as "userId", amount, status, upi_transaction_id as "upiTransactionId",
             created_at as "createdAt", completed_at as "completedAt"
      FROM payments
      WHERE status = $1
      ORDER BY created_at DESC
    `;

    const result = await this.pool.query(query, [status]);
    return result.rows;
  }
}
