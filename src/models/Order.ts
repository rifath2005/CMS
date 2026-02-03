import { Pool } from 'pg';

export enum OrderStatus {
  PENDING = 'PENDING',
  PREPARING = 'PREPARING',
  READY = 'READY',
  DELIVERED = 'DELIVERED',
  EXPIRED = 'EXPIRED'
}

export interface OrderItem {
  id?: string;
  orderId?: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  imageUrl?: string;
}

export interface Order {
  id: string;
  userId: string;
  userName?: string;  // Add optional userName field
  vendorId: string;
  items: OrderItem[];
  totalAmount: number;
  paymentId: string;
  status: OrderStatus;
  billGeneratedAt: Date;
  billExpiresAt: Date;
  qrCode: string;
  validationToken: string;
  isQrScanned: boolean;
  deliveredAt?: Date;
  createdAt: Date;
}

export interface CreateOrderData {
  userId: string;
  vendorId: string;
  items: OrderItem[];
  totalAmount: number;
  paymentId: string;
  status?: OrderStatus;
  billGeneratedAt?: Date;
  billExpiresAt?: Date;
  qrCode: string;
  validationToken: string;
}

export interface UpdateOrderData {
  status?: OrderStatus;
  isQrScanned?: boolean;
  deliveredAt?: Date;
}

export class OrderModel {
  constructor(private pool: Pool) {}

  async create(data: CreateOrderData): Promise<Order> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      const billGeneratedAt = data.billGeneratedAt || new Date();
      const billExpiresAt = data.billExpiresAt || new Date(billGeneratedAt.getTime() + 15 * 60 * 1000);

      // Insert order
      const orderQuery = `
        INSERT INTO orders (
          user_id, vendor_id, total_amount, payment_id, status,
          bill_generated_at, bill_expires_at, qr_code, validation_token
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, user_id as "userId", vendor_id as "vendorId", total_amount as "totalAmount",
                  payment_id as "paymentId", status, bill_generated_at as "billGeneratedAt",
                  bill_expires_at as "billExpiresAt", qr_code as "qrCode",
                  validation_token as "validationToken", is_qr_scanned as "isQrScanned",
                  delivered_at as "deliveredAt", created_at as "createdAt"
      `;

      const orderValues = [
        data.userId,
        data.vendorId,
        data.totalAmount,
        data.paymentId,
        data.status || OrderStatus.PENDING,
        billGeneratedAt,
        billExpiresAt,
        data.qrCode,
        data.validationToken
      ];

      const orderResult = await client.query(orderQuery, orderValues);
      const order = orderResult.rows[0];

      // Insert order items
      const itemsQuery = `
        INSERT INTO order_items (order_id, product_id, product_name, quantity, price, image_url)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id, order_id as "orderId", product_id as "productId", product_name as "productName",
                  quantity, price, image_url as "imageUrl"
      `;

      const items: OrderItem[] = [];
      for (const item of data.items) {
        const itemValues = [
          order.id,
          item.productId,
          item.productName,
          item.quantity,
          item.price,
          item.imageUrl || null
        ];
        const itemResult = await client.query(itemsQuery, itemValues);
        items.push(itemResult.rows[0]);
      }

      await client.query('COMMIT');

      return {
        ...order,
        items
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async findById(id: string): Promise<Order | null> {
    const orderQuery = `
      SELECT id, user_id as "userId", vendor_id as "vendorId", total_amount as "totalAmount",
             payment_id as "paymentId", status, bill_generated_at as "billGeneratedAt",
             bill_expires_at as "billExpiresAt", qr_code as "qrCode",
             validation_token as "validationToken", is_qr_scanned as "isQrScanned",
             delivered_at as "deliveredAt", created_at as "createdAt"
      FROM orders
      WHERE id = $1
    `;

    const orderResult = await this.pool.query(orderQuery, [id]);
    
    if (orderResult.rows.length === 0) {
      return null;
    }

    const order = orderResult.rows[0];

    // Get order items
    const itemsQuery = `
      SELECT id, order_id as "orderId", product_id as "productId", product_name as "productName",
             quantity, price, image_url as "imageUrl"
      FROM order_items
      WHERE order_id = $1
    `;

    const itemsResult = await this.pool.query(itemsQuery, [id]);

    return {
      ...order,
      items: itemsResult.rows
    };
  }

  async findByUserId(userId: string): Promise<Order[]> {
    const orderQuery = `
      SELECT id, user_id as "userId", vendor_id as "vendorId", total_amount as "totalAmount",
             payment_id as "paymentId", status, bill_generated_at as "billGeneratedAt",
             bill_expires_at as "billExpiresAt", qr_code as "qrCode",
             validation_token as "validationToken", is_qr_scanned as "isQrScanned",
             delivered_at as "deliveredAt", created_at as "createdAt"
      FROM orders
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;

    const orderResult = await this.pool.query(orderQuery, [userId]);
    
    const orders: Order[] = [];
    for (const orderRow of orderResult.rows) {
      const itemsQuery = `
        SELECT id, order_id as "orderId", product_id as "productId", product_name as "productName",
               quantity, price, image_url as "imageUrl"
        FROM order_items
        WHERE order_id = $1
      `;

      const itemsResult = await this.pool.query(itemsQuery, [orderRow.id]);

      orders.push({
        ...orderRow,
        items: itemsResult.rows
      });
    }

    return orders;
  }

  async findByVendorId(vendorId: string): Promise<Order[]> {
    const orderQuery = `
      SELECT id, user_id as "userId", vendor_id as "vendorId", total_amount as "totalAmount",
             payment_id as "paymentId", status, bill_generated_at as "billGeneratedAt",
             bill_expires_at as "billExpiresAt", qr_code as "qrCode",
             validation_token as "validationToken", is_qr_scanned as "isQrScanned",
             delivered_at as "deliveredAt", created_at as "createdAt"
      FROM orders
      WHERE vendor_id = $1
      ORDER BY created_at ASC
    `;

    const orderResult = await this.pool.query(orderQuery, [vendorId]);
    
    const orders: Order[] = [];
    for (const orderRow of orderResult.rows) {
      const itemsQuery = `
        SELECT id, order_id as "orderId", product_id as "productId", product_name as "productName",
               quantity, price, image_url as "imageUrl"
        FROM order_items
        WHERE order_id = $1
      `;

      const itemsResult = await this.pool.query(itemsQuery, [orderRow.id]);

      orders.push({
        ...orderRow,
        items: itemsResult.rows
      });
    }

    return orders;
  }

  async findByStatus(status: OrderStatus): Promise<Order[]> {
    const orderQuery = `
      SELECT id, user_id as "userId", vendor_id as "vendorId", total_amount as "totalAmount",
             payment_id as "paymentId", status, bill_generated_at as "billGeneratedAt",
             bill_expires_at as "billExpiresAt", qr_code as "qrCode",
             validation_token as "validationToken", is_qr_scanned as "isQrScanned",
             delivered_at as "deliveredAt", created_at as "createdAt"
      FROM orders
      WHERE status = $1
      ORDER BY created_at DESC
    `;

    const orderResult = await this.pool.query(orderQuery, [status]);
    
    const orders: Order[] = [];
    for (const orderRow of orderResult.rows) {
      const itemsQuery = `
        SELECT id, order_id as "orderId", product_id as "productId", product_name as "productName",
               quantity, price, image_url as "imageUrl"
        FROM order_items
        WHERE order_id = $1
      `;

      const itemsResult = await this.pool.query(itemsQuery, [orderRow.id]);

      orders.push({
        ...orderRow,
        items: itemsResult.rows
      });
    }

    return orders;
  }

  async update(id: string, data: UpdateOrderData): Promise<Order | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.status !== undefined) {
      updates.push(`status = $${paramCount++}`);
      values.push(data.status);
    }

    if (data.isQrScanned !== undefined) {
      updates.push(`is_qr_scanned = $${paramCount++}`);
      values.push(data.isQrScanned);
    }

    if (data.deliveredAt !== undefined) {
      updates.push(`delivered_at = $${paramCount++}`);
      values.push(data.deliveredAt);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    values.push(id);

    const query = `
      UPDATE orders
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id
    `;

    await this.pool.query(query, values);
    return this.findById(id);
  }

  async findByValidationToken(validationToken: string): Promise<Order | null> {
    const orderQuery = `
      SELECT id, user_id as "userId", vendor_id as "vendorId", total_amount as "totalAmount",
             payment_id as "paymentId", status, bill_generated_at as "billGeneratedAt",
             bill_expires_at as "billExpiresAt", qr_code as "qrCode",
             validation_token as "validationToken", is_qr_scanned as "isQrScanned",
             delivered_at as "deliveredAt", created_at as "createdAt"
      FROM orders
      WHERE validation_token = $1
    `;

    const orderResult = await this.pool.query(orderQuery, [validationToken]);
    
    if (orderResult.rows.length === 0) {
      return null;
    }

    const order = orderResult.rows[0];

    const itemsQuery = `
      SELECT id, order_id as "orderId", product_id as "productId", product_name as "productName",
             quantity, price, image_url as "imageUrl"
      FROM order_items
      WHERE order_id = $1
    `;

    const itemsResult = await this.pool.query(itemsQuery, [order.id]);

    return {
      ...order,
      items: itemsResult.rows
    };
  }

  async findActiveByVendorId(vendorId: string): Promise<Order[]> {
    const orderQuery = `
      SELECT 
        o.id, 
        o.user_id as "userId", 
        u.name as "userName",
        o.vendor_id as "vendorId", 
        o.total_amount as "totalAmount",
        o.payment_id as "paymentId", 
        o.status, 
        o.bill_generated_at as "billGeneratedAt",
        o.bill_expires_at as "billExpiresAt", 
        o.qr_code as "qrCode",
        o.validation_token as "validationToken", 
        o.is_qr_scanned as "isQrScanned",
        o.delivered_at as "deliveredAt", 
        o.created_at as "createdAt"
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.vendor_id = $1 AND o.status NOT IN ('DELIVERED', 'EXPIRED')
      ORDER BY o.created_at ASC
    `;

    const orderResult = await this.pool.query(orderQuery, [vendorId]);
    
    const orders: Order[] = [];
    for (const orderRow of orderResult.rows) {
      const itemsQuery = `
        SELECT id, order_id as "orderId", product_id as "productId", product_name as "productName",
               quantity, price, image_url as "imageUrl"
        FROM order_items
        WHERE order_id = $1
      `;

      const itemsResult = await this.pool.query(itemsQuery, [orderRow.id]);

      orders.push({
        ...orderRow,
        items: itemsResult.rows
      });
    }

    return orders;
  }

  async findHistoryByVendorId(vendorId: string): Promise<Order[]> {
    const orderQuery = `
      SELECT 
        o.id, 
        o.user_id as "userId", 
        u.name as "userName",
        o.vendor_id as "vendorId", 
        o.total_amount as "totalAmount",
        o.payment_id as "paymentId", 
        o.status, 
        o.bill_generated_at as "billGeneratedAt",
        o.bill_expires_at as "billExpiresAt", 
        o.qr_code as "qrCode",
        o.validation_token as "validationToken", 
        o.is_qr_scanned as "isQrScanned",
        o.delivered_at as "deliveredAt", 
        o.created_at as "createdAt"
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.vendor_id = $1 AND o.status IN ('DELIVERED', 'EXPIRED')
      ORDER BY o.created_at DESC
    `;

    const orderResult = await this.pool.query(orderQuery, [vendorId]);
    
    const orders: Order[] = [];
    for (const orderRow of orderResult.rows) {
      const itemsQuery = `
        SELECT id, order_id as "orderId", product_id as "productId", product_name as "productName",
               quantity, price, image_url as "imageUrl"
        FROM order_items
        WHERE order_id = $1
      `;

      const itemsResult = await this.pool.query(itemsQuery, [orderRow.id]);

      orders.push({
        ...orderRow,
        items: itemsResult.rows
      });
    }

    return orders;
  }
}
