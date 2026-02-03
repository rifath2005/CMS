import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import { OrderModel, Order, OrderStatus, OrderItem } from '../../models/Order';
import { PaymentService } from '../payment/PaymentService';
import { PaymentStatus } from '../../models/Payment';
import { CartService, CartItem } from '../cart/CartService';
import { OrderCalculation } from './OrderCalculation';
import { WalletOrderService } from './WalletOrderService';

export interface CreateOrderRequest {
  userId: string;
  paymentId: string;
}

export interface OrderCreationResult {
  order: Order;
  qrCodeDataUrl: string;
}

export class OrderService {
  private orderModel: OrderModel;
  private paymentService: PaymentService;
  private cartService: CartService;
  private orderCalculation: OrderCalculation;
  private walletOrderService: WalletOrderService;

  constructor(pool: Pool) {
    this.orderModel = new OrderModel(pool);
    this.paymentService = new PaymentService(pool);
    this.cartService = new CartService(pool);
    this.orderCalculation = new OrderCalculation(pool);
    this.walletOrderService = new WalletOrderService(pool);
  }

  /**
   * Create order with payment verification
   * This is the main order creation flow
   */
  async createOrder(request: CreateOrderRequest): Promise<OrderCreationResult> {
    const { userId, paymentId } = request;

    // Step 1: Verify payment is successful
    const payment = await this.paymentService.getPaymentDetails(paymentId);
    
    if (payment.status !== PaymentStatus.SUCCESS) {
      throw new Error('Payment must be successful before creating order');
    }

    if (payment.userId !== userId) {
      throw new Error('Payment does not belong to this user');
    }

    // Step 2: Get cart items
    const cart = await this.cartService.getCart(userId);

    if (cart.items.length === 0) {
      throw new Error('Cart is empty');
    }

    if (!cart.vendorId) {
      throw new Error('Cart must have a vendor');
    }

    // Step 3: Calculate and validate order total
    const calculation = await this.orderCalculation.calculateTotal(cart.items);

    // Verify payment amount matches order total
    if (Math.abs(payment.amount - calculation.total) > 0.01) {
      throw new Error(`Payment amount (${payment.amount}) does not match order total (${calculation.total})`);
    }

    // Step 4: Generate validation token and QR code
    const validationToken = uuidv4();
    const qrData = JSON.stringify({
      orderId: 'PENDING', // Will be updated after order creation
      validationToken,
      userId,
      vendorId: cart.vendorId,
      timestamp: new Date().toISOString()
    });

    const qrCodeDataUrl = await QRCode.toDataURL(qrData);

    // Step 5: Create order with items
    const orderItems: OrderItem[] = calculation.items.map(item => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      price: item.price,
      imageUrl: item.imageUrl
    }));

    const billGeneratedAt = new Date();
    const billExpiresAt = new Date(billGeneratedAt.getTime() + 15 * 60 * 1000); // 15 minutes

    const order = await this.orderModel.create({
      userId,
      vendorId: cart.vendorId,
      items: orderItems,
      totalAmount: calculation.total,
      paymentId,
      status: OrderStatus.PENDING,
      billGeneratedAt,
      billExpiresAt,
      qrCode: qrCodeDataUrl,
      validationToken
    });

    // Step 6: Clear cart after successful order creation
    await this.cartService.clearCart(userId);

    return {
      order,
      qrCodeDataUrl
    };
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId: string): Promise<Order> {
    const order = await this.orderModel.findById(orderId);
    
    if (!order) {
      throw new Error('Order not found');
    }

    return order;
  }

  /**
   * Get orders for a user
   */
  async getUserOrders(userId: string): Promise<Order[]> {
    return this.orderModel.findByUserId(userId);
  }

  /**
   * Get orders for a vendor
   */
  async getVendorOrders(vendorId: string): Promise<Order[]> {
    return this.orderModel.findByVendorId(vendorId);
  }

  /**
   * Get active orders for a vendor
   */
  async getActiveVendorOrders(vendorId: string): Promise<Order[]> {
    return this.orderModel.findActiveByVendorId(vendorId);
  }

  /**
   * Update order status
   */
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const order = await this.orderModel.findById(orderId);
    
    if (!order) {
      throw new Error('Order not found');
    }

    const updated = await this.orderModel.update(orderId, { status });

    if (!updated) {
      throw new Error('Failed to update order status');
    }

    return updated;
  }

  /**
   * Verify delivery with QR code
   */
  async verifyDelivery(orderId: string, validationToken: string): Promise<Order> {
    const order = await this.orderModel.findById(orderId);
    
    if (!order) {
      throw new Error('Order not found');
    }

    // Verify validation token
    if (order.validationToken !== validationToken) {
      throw new Error('Invalid validation token');
    }

    // Check if already delivered
    if (order.status === OrderStatus.DELIVERED) {
      throw new Error('Order already delivered');
    }

    // Check if QR code already scanned
    if (order.isQrScanned) {
      throw new Error('QR code already scanned');
    }

    // Check if bill has expired
    if (new Date() > order.billExpiresAt) {
      // Mark as expired
      await this.orderModel.update(orderId, { status: OrderStatus.EXPIRED });
      throw new Error('Bill has expired');
    }

    // Update order to delivered
    const updated = await this.orderModel.update(orderId, {
      status: OrderStatus.DELIVERED,
      isQrScanned: true,
      deliveredAt: new Date()
    });

    if (!updated) {
      throw new Error('Failed to update order');
    }

    return updated;
  }

  /**
   * Verify order by validation token (for QR scanner)
   */
  async verifyByToken(validationToken: string): Promise<any> {
    const order = await this.orderModel.findByValidationToken(validationToken);
    
    if (!order) {
      throw new Error('Invalid QR code or order not found');
    }

    // Check if already delivered
    if (order.status === OrderStatus.DELIVERED) {
      throw new Error('Order already delivered');
    }

    // Check if bill has expired
    if (new Date() > order.billExpiresAt) {
      await this.orderModel.update(order.id, { status: OrderStatus.EXPIRED });
      throw new Error('Bill has expired');
    }

    // Update order to delivered
    const updated = await this.orderModel.update(order.id, {
      status: OrderStatus.DELIVERED,
      isQrScanned: true,
      deliveredAt: new Date()
    });

    if (!updated) {
      throw new Error('Failed to update order');
    }

    // Return order details for display
    return {
      orderId: updated.id,
      userName: 'Customer', // You may want to join with users table
      items: updated.items,
      totalAmount: updated.totalAmount
    };
  }

  /**
   * Get order by validation token
   */
  async getOrderByValidationToken(validationToken: string): Promise<Order> {
    const order = await this.orderModel.findByValidationToken(validationToken);
    
    if (!order) {
      throw new Error('Order not found');
    }

    return order;
  }

  /**
   * Check if bill is valid (not expired)
   */
  async isBillValid(orderId: string): Promise<boolean> {
    const order = await this.orderModel.findById(orderId);
    
    if (!order) {
      return false;
    }

    if (order.status === OrderStatus.EXPIRED || order.status === OrderStatus.DELIVERED) {
      return false;
    }

    return new Date() <= order.billExpiresAt;
  }

  /**
   * Get remaining time for bill in seconds
   */
  async getRemainingTime(orderId: string): Promise<number> {
    const order = await this.orderModel.findById(orderId);
    
    if (!order) {
      throw new Error('Order not found');
    }

    const now = new Date();
    const remainingMs = order.billExpiresAt.getTime() - now.getTime();
    const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));

    return remainingSeconds;
  }

  /**
   * Mark expired orders
   */
  async markExpiredOrders(): Promise<number> {
    const orders = await this.orderModel.findByStatus(OrderStatus.PENDING);
    let expiredCount = 0;

    for (const order of orders) {
      if (new Date() > order.billExpiresAt) {
        await this.orderModel.update(order.id, { status: OrderStatus.EXPIRED });
        expiredCount++;
      }
    }

    return expiredCount;
  }

  /**
   * Get order history for user (delivered orders)
   */
  async getUserOrderHistory(userId: string): Promise<Order[]> {
    const allOrders = await this.orderModel.findByUserId(userId);
    return allOrders.filter(order => order.status === OrderStatus.DELIVERED);
  }

  /**
   * Create order with wallet payment (integrated flow)
   * This method handles the complete wallet payment + order creation flow
   */
  async createOrderWithWallet(userId: string): Promise<any> {
    // Get user's cart
    const cart = await this.cartService.getCart(userId);

    if (cart.items.length === 0) {
      throw new Error('Cart is empty');
    }

    if (!cart.vendorId) {
      throw new Error('Cart must have a vendor');
    }

    // Calculate total
    const calculation = await this.orderCalculation.calculateTotal(cart.items);

    // Process wallet payment and create order atomically
    const result = await this.walletOrderService.processWalletPayment(
      userId,
      cart.items,
      calculation.total
    );

    // Clear cart after successful order creation
    await this.cartService.clearCart(userId);

    return result;
  }
}
