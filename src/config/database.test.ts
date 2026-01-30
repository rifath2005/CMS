import { pool, query, transaction } from './database';

describe('Database Configuration', () => {
  afterAll(async () => {
    await pool.end();
  });

  describe('Connection', () => {
    it('should connect to the database', async () => {
      const result = await pool.query('SELECT NOW()');
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].now).toBeInstanceOf(Date);
    });

    it('should execute queries using the query helper', async () => {
      const result = await query('SELECT 1 + 1 AS sum');
      expect(result.rows[0].sum).toBe(2);
    });
  });

  describe('Transactions', () => {
    it('should commit successful transactions', async () => {
      const result = await transaction(async (client) => {
        const res = await client.query('SELECT 2 + 2 AS sum');
        return res.rows[0].sum;
      });
      
      expect(result).toBe(4);
    });

    it('should rollback failed transactions', async () => {
      await expect(
        transaction(async (client) => {
          await client.query('SELECT 1');
          throw new Error('Test error');
        })
      ).rejects.toThrow('Test error');
    });
  });

  describe('Schema Validation', () => {
    it('should have all required tables', async () => {
      const result = await query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'institutions', 'canteens', 'products', 'orders', 'order_items', 'payments')
        ORDER BY table_name
      `);
      
      const tableNames = result.rows.map(row => row.table_name);
      expect(tableNames).toContain('users');
      expect(tableNames).toContain('institutions');
      expect(tableNames).toContain('canteens');
      expect(tableNames).toContain('products');
      expect(tableNames).toContain('orders');
      expect(tableNames).toContain('order_items');
      expect(tableNames).toContain('payments');
    });

    it('should have proper indexes on users table', async () => {
      const result = await query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'users'
      `);
      
      const indexNames = result.rows.map(row => row.indexname);
      expect(indexNames).toContain('idx_users_email');
      expect(indexNames).toContain('idx_users_institution');
    });

    it('should have proper indexes on orders table', async () => {
      const result = await query(`
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename = 'orders'
      `);
      
      const indexNames = result.rows.map(row => row.indexname);
      expect(indexNames).toContain('idx_orders_user');
      expect(indexNames).toContain('idx_orders_vendor');
      expect(indexNames).toContain('idx_orders_status');
      expect(indexNames).toContain('idx_orders_validation_token');
    });
  });

  describe('Constraints', () => {
    it('should enforce unique email constraint', async () => {
      const testEmail = `test-${Date.now()}@example.com`;
      
      // Insert first user
      await query(
        'INSERT INTO users (email, password_hash, name, role, institution_id) VALUES ($1, $2, $3, $4, $5)',
        [testEmail, 'hash', 'Test User', 'USER', '00000000-0000-0000-0000-000000000001']
      );
      
      // Try to insert duplicate
      await expect(
        query(
          'INSERT INTO users (email, password_hash, name, role, institution_id) VALUES ($1, $2, $3, $4, $5)',
          [testEmail, 'hash', 'Test User 2', 'USER', '00000000-0000-0000-0000-000000000001']
        )
      ).rejects.toThrow();
      
      // Cleanup
      await query('DELETE FROM users WHERE email = $1', [testEmail]);
    });

    it('should enforce foreign key constraints', async () => {
      // Try to insert order with non-existent user
      await expect(
        query(
          `INSERT INTO orders (user_id, vendor_id, total_amount, payment_id, status, bill_generated_at, bill_expires_at, qr_code, validation_token) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            '99999999-9999-9999-9999-999999999999',
            'SS1',
            100,
            '99999999-9999-9999-9999-999999999999',
            'PENDING',
            new Date(),
            new Date(),
            'qr',
            'token'
          ]
        )
      ).rejects.toThrow();
    });

    it('should enforce check constraints on price', async () => {
      // Try to insert product with negative price
      await expect(
        query(
          'INSERT INTO products (vendor_id, name, price) VALUES ($1, $2, $3)',
          ['SS1', 'Test Product', -10]
        )
      ).rejects.toThrow();
    });
  });
});
