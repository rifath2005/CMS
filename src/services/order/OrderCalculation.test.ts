import { Pool } from 'pg';
import { OrderCalculation } from './OrderCalculation';
import { CartItem } from '../cart/CartService';

describe('OrderCalculation', () => {
  let pool: Pool;
  let orderCalculation: OrderCalculation;
  let testVendorId: string;
  let testProductId1: string;
  let testProductId2: string;

  beforeAll(async () => {
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'canteen_test',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres'
    });

    orderCalculation = new OrderCalculation(pool);

    // Create test data
    const institutionResult = await pool.query(`
      INSERT INTO institutions (name, email_domain, contact_email)
      VALUES ('Test Institution', 'test.edu', 'test@test.edu')
      RETURNING id
    `);
    const institutionId = institutionResult.rows[0].id;

    const canteenResult = await pool.query(`
      INSERT INTO canteens (institution_id, vendor_id, name, location, is_active, is_approved)
      VALUES ($1, 'SS1', 'Test Canteen', 'Building A', true, true)
      RETURNING vendor_id
    `, [institutionId]);
    testVendorId = canteenResult.rows[0].vendor_id;

    const product1Result = await pool.query(`
      INSERT INTO products (vendor_id, name, description, price, category, stock_quantity, is_available)
      VALUES ($1, 'Product 1', 'Description 1', 50.00, 'Food', 100, true)
      RETURNING id
    `, [testVendorId]);
    testProductId1 = product1Result.rows[0].id;

    const product2Result = await pool.query(`
      INSERT INTO products (vendor_id, name, description, price, category, stock_quantity, is_available)
      VALUES ($1, 'Product 2', 'Description 2', 75.50, 'Beverage', 50, true)
      RETURNING id
    `, [testVendorId]);
    testProductId2 = product2Result.rows[0].id;
  });

  afterAll(async () => {
    await pool.query('DELETE FROM products WHERE vendor_id = $1', [testVendorId]);
    await pool.query('DELETE FROM canteens WHERE vendor_id = $1', [testVendorId]);
    await pool.query('DELETE FROM institutions WHERE email_domain = $1', ['test.edu']);
    await pool.end();
  });

  describe('calculateTotal', () => {
    it('should calculate total for single item', async () => {
      const items: CartItem[] = [
        {
          productId: testProductId1,
          productName: 'Product 1',
          quantity: 2,
          price: 50.00,
          vendorId: testVendorId
        }
      ];

      const result = await orderCalculation.calculateTotal(items);

      expect(result.subtotal).toBe(100.00);
      expect(result.total).toBe(100.00);
      expect(result.items).toHaveLength(1);
    });

    it('should calculate total for multiple items', async () => {
      const items: CartItem[] = [
        {
          productId: testProductId1,
          productName: 'Product 1',
          quantity: 2,
          price: 50.00,
          vendorId: testVendorId
        },
        {
          productId: testProductId2,
          productName: 'Product 2',
          quantity: 1,
          price: 75.50,
          vendorId: testVendorId
        }
      ];

      const result = await orderCalculation.calculateTotal(items);

      expect(result.subtotal).toBe(175.50);
      expect(result.total).toBe(175.50);
      expect(result.items).toHaveLength(2);
    });

    it('should return zero for empty cart', async () => {
      const result = await orderCalculation.calculateTotal([]);

      expect(result.subtotal).toBe(0);
      expect(result.total).toBe(0);
      expect(result.items).toHaveLength(0);
    });

    it('should handle decimal calculations correctly', async () => {
      const items: CartItem[] = [
        {
          productId: testProductId2,
          productName: 'Product 2',
          quantity: 3,
          price: 75.50,
          vendorId: testVendorId
        }
      ];

      const result = await orderCalculation.calculateTotal(items);

      expect(result.subtotal).toBe(226.50);
      expect(result.total).toBe(226.50);
    });

    it('should throw error for unavailable product', async () => {
      // Mark product as unavailable
      await pool.query('UPDATE products SET is_available = false WHERE id = $1', [testProductId1]);

      const items: CartItem[] = [
        {
          productId: testProductId1,
          productName: 'Product 1',
          quantity: 1,
          price: 50.00,
          vendorId: testVendorId
        }
      ];

      await expect(orderCalculation.calculateTotal(items)).rejects.toThrow('Price validation failed');

      // Restore availability
      await pool.query('UPDATE products SET is_available = true WHERE id = $1', [testProductId1]);
    });

    it('should throw error for insufficient stock', async () => {
      const items: CartItem[] = [
        {
          productId: testProductId1,
          productName: 'Product 1',
          quantity: 150, // Stock is 100
          price: 50.00,
          vendorId: testVendorId
        }
      ];

      await expect(orderCalculation.calculateTotal(items)).rejects.toThrow('Price validation failed');
    });
  });

  describe('validatePrices', () => {
    it('should validate correct prices', async () => {
      const items: CartItem[] = [
        {
          productId: testProductId1,
          productName: 'Product 1',
          quantity: 2,
          price: 50.00,
          vendorId: testVendorId
        }
      ];

      const result = await orderCalculation.validatePrices(items);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.updatedItems).toHaveLength(1);
    });

    it('should detect price changes', async () => {
      const items: CartItem[] = [
        {
          productId: testProductId1,
          productName: 'Product 1',
          quantity: 2,
          price: 45.00, // Wrong price
          vendorId: testVendorId
        }
      ];

      const result = await orderCalculation.validatePrices(items);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Price'))).toBe(true);
      expect(result.updatedItems[0].price).toBe(50.00); // Corrected price
    });

    it('should detect non-existent products', async () => {
      const items: CartItem[] = [
        {
          productId: '00000000-0000-0000-0000-000000000000',
          productName: 'Invalid Product',
          quantity: 1,
          price: 50.00,
          vendorId: testVendorId
        }
      ];

      const result = await orderCalculation.validatePrices(items);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('not found'))).toBe(true);
    });

    it('should detect unavailable products', async () => {
      // Mark product as unavailable
      await pool.query('UPDATE products SET is_available = false WHERE id = $1', [testProductId1]);

      const items: CartItem[] = [
        {
          productId: testProductId1,
          productName: 'Product 1',
          quantity: 1,
          price: 50.00,
          vendorId: testVendorId
        }
      ];

      const result = await orderCalculation.validatePrices(items);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('no longer available'))).toBe(true);

      // Restore availability
      await pool.query('UPDATE products SET is_available = true WHERE id = $1', [testProductId1]);
    });

    it('should detect insufficient stock', async () => {
      const items: CartItem[] = [
        {
          productId: testProductId1,
          productName: 'Product 1',
          quantity: 150,
          price: 50.00,
          vendorId: testVendorId
        }
      ];

      const result = await orderCalculation.validatePrices(items);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Insufficient stock'))).toBe(true);
    });
  });

  describe('calculateItemTotal', () => {
    it('should calculate item total correctly', () => {
      const total = orderCalculation.calculateItemTotal(50.00, 3);
      expect(total).toBe(150.00);
    });

    it('should handle decimal prices', () => {
      const total = orderCalculation.calculateItemTotal(12.99, 2);
      expect(total).toBe(25.98);
    });

    it('should round to two decimal places', () => {
      const total = orderCalculation.calculateItemTotal(10.333, 3);
      expect(total).toBe(30.99);
    });
  });

  describe('validateMinimumOrder', () => {
    it('should validate order meets minimum', () => {
      const isValid = orderCalculation.validateMinimumOrder(100.00, 50.00);
      expect(isValid).toBe(true);
    });

    it('should reject order below minimum', () => {
      const isValid = orderCalculation.validateMinimumOrder(30.00, 50.00);
      expect(isValid).toBe(false);
    });

    it('should accept order equal to minimum', () => {
      const isValid = orderCalculation.validateMinimumOrder(50.00, 50.00);
      expect(isValid).toBe(true);
    });
  });

  describe('calculateTax', () => {
    it('should calculate tax with default rate', () => {
      const tax = orderCalculation.calculateTax(100.00);
      expect(tax).toBe(0); // Default rate is 0
    });

    it('should calculate tax with custom rate', () => {
      const tax = orderCalculation.calculateTax(100.00, 0.1);
      expect(tax).toBe(10.00);
    });

    it('should round tax to two decimals', () => {
      const tax = orderCalculation.calculateTax(99.99, 0.085);
      expect(tax).toBe(8.50);
    });
  });

  describe('calculateDiscount', () => {
    it('should calculate discount with default rate', () => {
      const discount = orderCalculation.calculateDiscount(100.00);
      expect(discount).toBe(0); // Default rate is 0
    });

    it('should calculate discount with custom rate', () => {
      const discount = orderCalculation.calculateDiscount(100.00, 0.15);
      expect(discount).toBe(15.00);
    });

    it('should round discount to two decimals', () => {
      const discount = orderCalculation.calculateDiscount(99.99, 0.125);
      expect(discount).toBe(12.50);
    });
  });

  describe('getOrderSummary', () => {
    it('should return complete order summary', async () => {
      const items: CartItem[] = [
        {
          productId: testProductId1,
          productName: 'Product 1',
          quantity: 2,
          price: 50.00,
          vendorId: testVendorId
        },
        {
          productId: testProductId2,
          productName: 'Product 2',
          quantity: 3,
          price: 75.50,
          vendorId: testVendorId
        }
      ];

      const summary = await orderCalculation.getOrderSummary(items);

      expect(summary.itemCount).toBe(2);
      expect(summary.totalQuantity).toBe(5);
      expect(summary.calculation.subtotal).toBe(326.50);
      expect(summary.calculation.total).toBe(326.50);
    });

    it('should return empty summary for no items', async () => {
      const summary = await orderCalculation.getOrderSummary([]);

      expect(summary.itemCount).toBe(0);
      expect(summary.totalQuantity).toBe(0);
      expect(summary.calculation.total).toBe(0);
    });
  });
});
