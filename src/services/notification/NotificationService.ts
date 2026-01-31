export interface Notification {
  userId: string;
  type: 'BILL_EXPIRED' | 'ORDER_DELIVERED' | 'LOW_STOCK' | 'NEW_ORDER';
  title: string;
  message: string;
  data?: any;
  timestamp: Date;
}

export class NotificationService {
  /**
   * Send notification to user
   * In production, this would integrate with push notification services
   */
  async sendNotification(notification: Notification): Promise<void> {
    // Mock implementation
    // In production, integrate with:
    // - Firebase Cloud Messaging (FCM)
    // - Apple Push Notification Service (APNS)
    // - Email service
    // - SMS service
    
    console.log('Notification sent:', notification);
  }

  /**
   * Send bill expiration notification
   */
  async sendBillExpirationNotification(userId: string, orderId: string): Promise<void> {
    const notification: Notification = {
      userId,
      type: 'BILL_EXPIRED',
      title: 'Bill Expired',
      message: 'Your order bill has expired. Please contact support if you need assistance.',
      data: { orderId },
      timestamp: new Date()
    };

    await this.sendNotification(notification);
  }

  /**
   * Send order delivered notification
   */
  async sendOrderDeliveredNotification(userId: string, orderId: string): Promise<void> {
    const notification: Notification = {
      userId,
      type: 'ORDER_DELIVERED',
      title: 'Order Delivered',
      message: 'Your order has been successfully delivered. Thank you!',
      data: { orderId },
      timestamp: new Date()
    };

    await this.sendNotification(notification);
  }

  /**
   * Send new order notification to vendor
   */
  async sendNewOrderNotification(vendorId: string, orderId: string): Promise<void> {
    const notification: Notification = {
      userId: vendorId,
      type: 'NEW_ORDER',
      title: 'New Order',
      message: 'You have received a new order.',
      data: { orderId },
      timestamp: new Date()
    };

    await this.sendNotification(notification);
  }

  /**
   * Send low stock notification to vendor
   */
  async sendLowStockNotification(vendorId: string, productId: string, productName: string, stockQuantity: number): Promise<void> {
    const notification: Notification = {
      userId: vendorId,
      type: 'LOW_STOCK',
      title: 'Low Stock Alert',
      message: `${productName} is running low on stock (${stockQuantity} remaining).`,
      data: { productId, productName, stockQuantity },
      timestamp: new Date()
    };

    await this.sendNotification(notification);
  }
}
