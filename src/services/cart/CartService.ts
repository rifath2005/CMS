import { createClient, RedisClientType } from 'redis';
import { Pool } from 'pg';

export interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  imageUrl?: string;
  vendorId: string;
}

export interface Cart {
  userId: string;
  items: CartItem[];
  totalAmount: number;
  vendorId?: string;
}

export class CartService {
  private redisClient: RedisClientType;
  private pool: Pool;
  private readonly CART_TTL = 24 * 60 * 60; // 24 hours

  constructor(pool: Pool, redisClient?: RedisClientType) {
    this.pool = pool;
    this.redisClient = redisClient || createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
  }

  async connect(): Promise<void> {
    if (!this.redisClient.isOpen) {
      await this.redisClient.connect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.redisClient.isOpen) {
      await this.redisClient.quit();
    }
  }

  private getCartKey(userId: string): string {
    return `cart:${userId}`;
  }

  /**
   * Add item to cart
   */
  async addItem(userId: string, item: CartItem): Promise<Cart> {
    await this.connect();

    // Validate product exists and is available
    const product = await this.pool.query(
      'SELECT id, vendor_id, name, price, is_available, stock_quantity FROM products WHERE id = $1',
      [item.productId]
    );

    if (product.rows.length === 0) {
      throw new Error('Product not found');
    }

    const productData = product.rows[0];

    if (!productData.is_available || productData.stock_quantity === 0) {
      throw new Error('Product is not available');
    }

    if (item.quantity > productData.stock_quantity) {
      throw new Error(`Only ${productData.stock_quantity} items available in stock`);
    }

    // Get current cart
    const cart = await this.getCart(userId);

    // Check if cart has items from different vendor
    if (cart.items.length > 0 && cart.vendorId && cart.vendorId !== item.vendorId) {
      throw new Error('Cannot add items from different vendors to cart');
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(i => i.productId === item.productId);

    if (existingItemIndex >= 0) {
      // Update quantity
      cart.items[existingItemIndex].quantity += item.quantity;
      
      // Validate total quantity doesn't exceed stock
      if (cart.items[existingItemIndex].quantity > productData.stock_quantity) {
        throw new Error(`Cannot add more than ${productData.stock_quantity} items`);
      }
    } else {
      // Add new item
      cart.items.push({
        ...item,
        productName: productData.name,
        price: productData.price,
        vendorId: productData.vendor_id
      });
    }

    // Set vendor ID if this is first item
    if (!cart.vendorId) {
      cart.vendorId = item.vendorId;
    }

    // Calculate total
    cart.totalAmount = cart.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

    // Save to Redis
    await this.saveCart(userId, cart);

    return cart;
  }

  /**
   * Remove item from cart
   */
  async removeItem(userId: string, productId: string): Promise<Cart> {
    await this.connect();

    const cart = await this.getCart(userId);

    cart.items = cart.items.filter(item => item.productId !== productId);

    // Clear vendor ID if cart is empty
    if (cart.items.length === 0) {
      cart.vendorId = undefined;
    }

    // Recalculate total
    cart.totalAmount = cart.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

    await this.saveCart(userId, cart);

    return cart;
  }

  /**
   * Update item quantity in cart
   */
  async updateItemQuantity(userId: string, productId: string, quantity: number): Promise<Cart> {
    await this.connect();

    if (quantity <= 0) {
      return this.removeItem(userId, productId);
    }

    // Validate product stock
    const product = await this.pool.query(
      'SELECT stock_quantity, is_available FROM products WHERE id = $1',
      [productId]
    );

    if (product.rows.length === 0) {
      throw new Error('Product not found');
    }

    const productData = product.rows[0];

    if (!productData.is_available) {
      throw new Error('Product is not available');
    }

    if (quantity > productData.stock_quantity) {
      throw new Error(`Only ${productData.stock_quantity} items available in stock`);
    }

    const cart = await this.getCart(userId);

    const itemIndex = cart.items.findIndex(item => item.productId === productId);

    if (itemIndex === -1) {
      throw new Error('Item not found in cart');
    }

    cart.items[itemIndex].quantity = quantity;

    // Recalculate total
    cart.totalAmount = cart.items.reduce((sum, i) => sum + (i.price * i.quantity), 0);

    await this.saveCart(userId, cart);

    return cart;
  }

  /**
   * Get cart for user
   */
  async getCart(userId: string): Promise<Cart> {
    await this.connect();

    const cartKey = this.getCartKey(userId);
    const cartData = await this.redisClient.get(cartKey);

    if (!cartData) {
      return {
        userId,
        items: [],
        totalAmount: 0
      };
    }

    return JSON.parse(cartData);
  }

  /**
   * Clear cart
   */
  async clearCart(userId: string): Promise<void> {
    await this.connect();

    const cartKey = this.getCartKey(userId);
    await this.redisClient.del(cartKey);
  }

  /**
   * Save cart to Redis
   */
  private async saveCart(userId: string, cart: Cart): Promise<void> {
    const cartKey = this.getCartKey(userId);
    await this.redisClient.setEx(cartKey, this.CART_TTL, JSON.stringify(cart));
  }

  /**
   * Validate cart items against current product data
   */
  async validateCart(userId: string): Promise<{ valid: boolean; errors: string[] }> {
    await this.connect();

    const cart = await this.getCart(userId);
    const errors: string[] = [];

    for (const item of cart.items) {
      const product = await this.pool.query(
        'SELECT price, is_available, stock_quantity FROM products WHERE id = $1',
        [item.productId]
      );

      if (product.rows.length === 0) {
        errors.push(`Product ${item.productName} no longer exists`);
        continue;
      }

      const productData = product.rows[0];

      if (!productData.is_available) {
        errors.push(`Product ${item.productName} is no longer available`);
      }

      if (item.quantity > productData.stock_quantity) {
        errors.push(`Only ${productData.stock_quantity} of ${item.productName} available (you have ${item.quantity} in cart)`);
      }

      if (item.price !== parseFloat(productData.price)) {
        errors.push(`Price of ${item.productName} has changed from ${item.price} to ${productData.price}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get cart item count
   */
  async getItemCount(userId: string): Promise<number> {
    const cart = await this.getCart(userId);
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }
}
