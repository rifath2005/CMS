import { Pool } from 'pg';
import { CartItem } from '../cart/CartService';

export interface OrderCalculationResult {
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  items: CartItem[];
}

export interface PriceValidationResult {
  valid: boolean;
  errors: string[];
  updatedItems: CartItem[];
}

export class OrderCalculation {
  private pool: Pool;
  private readonly TAX_RATE = 0.0; // No tax for now, can be configured
  private readonly DISCOUNT_RATE = 0.0; // No discount for now, can be configured

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Calculate order total from cart items
   * Validates prices against current product prices
   */
  async calculateTotal(items: CartItem[]): Promise<OrderCalculationResult> {
    if (!items || items.length === 0) {
      return {
        subtotal: 0,
        tax: 0,
        discount: 0,
        total: 0,
        items: []
      };
    }

    // Validate and get current prices
    const validation = await this.validatePrices(items);

    if (!validation.valid) {
      throw new Error(`Price validation failed: ${validation.errors.join(', ')}`);
    }

    // Use validated items with current prices
    const validatedItems = validation.updatedItems;

    // Calculate subtotal
    const subtotal = validatedItems.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    // Calculate tax
    const tax = subtotal * this.TAX_RATE;

    // Calculate discount
    const discount = subtotal * this.DISCOUNT_RATE;

    // Calculate total
    const total = subtotal + tax - discount;

    return {
      subtotal: this.roundToTwoDecimals(subtotal),
      tax: this.roundToTwoDecimals(tax),
      discount: this.roundToTwoDecimals(discount),
      total: this.roundToTwoDecimals(total),
      items: validatedItems
    };
  }

  /**
   * Validate cart item prices against current product prices
   */
  async validatePrices(items: CartItem[]): Promise<PriceValidationResult> {
    const errors: string[] = [];
    const updatedItems: CartItem[] = [];

    for (const item of items) {
      const productQuery = `
        SELECT id, name, price, is_available, stock_quantity
        FROM products
        WHERE id = $1
      `;

      const result = await this.pool.query(productQuery, [item.productId]);

      if (result.rows.length === 0) {
        errors.push(`Product ${item.productName} (${item.productId}) not found`);
        continue;
      }

      const product = result.rows[0];

      // Check availability
      if (!product.is_available) {
        errors.push(`Product ${product.name} is no longer available`);
        continue;
      }

      // Check stock
      if (item.quantity > product.stock_quantity) {
        errors.push(`Insufficient stock for ${product.name}. Available: ${product.stock_quantity}, Requested: ${item.quantity}`);
        continue;
      }

      // Get current price
      const currentPrice = parseFloat(product.price);

      // Update item with current price
      updatedItems.push({
        ...item,
        productName: product.name,
        price: currentPrice
      });

      // Check if price changed
      if (Math.abs(item.price - currentPrice) > 0.01) {
        errors.push(`Price of ${product.name} has changed from ${item.price} to ${currentPrice}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      updatedItems
    };
  }

  /**
   * Calculate total for a single item
   */
  calculateItemTotal(price: number, quantity: number): number {
    return this.roundToTwoDecimals(price * quantity);
  }

  /**
   * Validate minimum order amount
   */
  validateMinimumOrder(total: number, minimumAmount: number = 0): boolean {
    return total >= minimumAmount;
  }

  /**
   * Calculate tax amount
   */
  calculateTax(subtotal: number, taxRate: number = this.TAX_RATE): number {
    return this.roundToTwoDecimals(subtotal * taxRate);
  }

  /**
   * Calculate discount amount
   */
  calculateDiscount(subtotal: number, discountRate: number = this.DISCOUNT_RATE): number {
    return this.roundToTwoDecimals(subtotal * discountRate);
  }

  /**
   * Apply coupon discount
   */
  applyCouponDiscount(subtotal: number, couponCode: string): number {
    // Placeholder for coupon logic
    // In production, this would query a coupons table
    return 0;
  }

  /**
   * Round to two decimal places
   */
  private roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
  }

  /**
   * Get order summary
   */
  async getOrderSummary(items: CartItem[]): Promise<{
    itemCount: number;
    totalQuantity: number;
    calculation: OrderCalculationResult;
  }> {
    const calculation = await this.calculateTotal(items);
    
    const itemCount = items.length;
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      itemCount,
      totalQuantity,
      calculation
    };
  }
}
