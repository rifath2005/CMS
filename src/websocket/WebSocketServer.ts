import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { UserRole } from '../types';
import { ConnectionManager } from './ConnectionManager';
import { verifyToken } from '../services/auth/jwt';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  role?: UserRole;
  institutionId?: string;
  canteenId?: string;
}

export class WebSocketServer {
  private io: Server;
  private connectionManager: ConnectionManager;

  constructor(httpServer: HttpServer) {
    // Initialize Socket.io with CORS configuration
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    this.connectionManager = new ConnectionManager();
    this.setupMiddleware();
    this.setupConnectionHandlers();
  }

  /**
   * Setup authentication middleware for WebSocket connections
   */
  private setupMiddleware(): void {
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        // Get token from socket handshake auth
        const token = socket.handshake.auth.token;

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verify JWT token with expiration check
        const decoded = await verifyToken(token);
        
        // Attach user information to socket
        socket.userId = decoded.userId;
        socket.role = decoded.role;
        socket.institutionId = decoded.institutionId;
        socket.canteenId = decoded.canteenId;

        next();
      } catch (error) {
        console.error('WebSocket authentication error:', error);
        next(new Error('Authentication failed: Invalid or expired token'));
      }
    });
  }

  /**
   * Setup connection event handlers
   */
  private setupConnectionHandlers(): void {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`Client connected: ${socket.id} (User: ${socket.userId}, Role: ${socket.role})`);

      // Register connection
      this.connectionManager.addConnection(socket);

      // Join role-based rooms
      this.joinRoleBasedRooms(socket);

      // Setup disconnect handler
      socket.on('disconnect', (reason) => {
        console.log(`Client disconnected: ${socket.id} (Reason: ${reason})`);
        this.connectionManager.removeConnection(socket.id);
      });

      // Setup error handler
      socket.on('error', (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
      });

      // Send connection confirmation
      socket.emit('connected', {
        message: 'Connected to Canteen Management System',
        userId: socket.userId,
        role: socket.role,
        timestamp: new Date().toISOString(),
      });
    });
  }

  /**
   * Join user to appropriate rooms based on their role and institution
   * Backend-controlled room assignment only
   */
  private joinRoleBasedRooms(socket: AuthenticatedSocket): void {
    if (!socket.userId || !socket.role) return;

    // Always join user-specific room
    socket.join(`user:${socket.userId}`);

    // Always join institution room if available
    if (socket.institutionId) {
      socket.join(`institution:${socket.institutionId}`);
    }

    // Role-specific room assignment
    switch (socket.role) {
      case UserRole.VENDOR:
        // Vendors join canteen-specific room if canteenId is available
        if (socket.canteenId) {
          socket.join(`canteen:${socket.canteenId}`);
          console.log(`Vendor ${socket.userId} joined canteen room: canteen:${socket.canteenId}`);
        }
        break;
      
      case UserRole.INSTITUTION_ADMIN:
        socket.join(`institution-admin:${socket.institutionId}`);
        break;
      
      case UserRole.MAIN_ADMIN:
        socket.join('main-admin');
        break;
      
      case UserRole.USER:
        // Regular users join customer room for their institution
        socket.join(`customer:${socket.institutionId}`);
        break;
    }

    console.log(`User ${socket.userId} (${socket.role}) joined appropriate rooms`);
  }

  /**
   * Notify canteen of new order (ONLY after payment DB commit)
   * Emits to canteen-specific room only
   */
  public notifyNewOrder(canteenId: string, orderData: any): void {
    this.io.to(`canteen:${canteenId}`).emit('order:new', {
      ...orderData,
      timestamp: new Date().toISOString(),
    });

    console.log(`New order notification sent to canteen:${canteenId}`);
  }

  /**
   * Broadcast order status update to relevant users
   */
  public broadcastOrderUpdate(orderId: string, userId: string, canteenId: string, update: any): void {
    // Send to the user who placed the order
    this.io.to(`user:${userId}`).emit('order:status-update', {
      orderId,
      ...update,
      timestamp: new Date().toISOString(),
    });

    // Send to the canteen
    this.io.to(`canteen:${canteenId}`).emit('order:status-update', {
      orderId,
      ...update,
      timestamp: new Date().toISOString(),
    });

    console.log(`Order update broadcasted for order ${orderId}`);
  }

  /**
   * Send timer update to a specific user
   */
  public sendTimerUpdate(userId: string, orderId: string, remainingSeconds: number): void {
    this.io.to(`user:${userId}`).emit('bill:timer-update', {
      orderId,
      remainingSeconds,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Notify vendor of new order
   */
  public notifyVendor(vendorId: string, notification: any): void {
    this.io.to(`vendor:${vendorId}`).emit('order:new', {
      ...notification,
      timestamp: new Date().toISOString(),
    });

    console.log(`New order notification sent to vendor ${vendorId}`);
  }

  /**
   * Broadcast stock change to all users in an institution
   */
  public broadcastStockChange(institutionId: string, productId: string, stockData: any): void {
    this.io.to(`institution:${institutionId}`).emit('product:stock-update', {
      productId,
      ...stockData,
      timestamp: new Date().toISOString(),
    });

    console.log(`Stock update broadcasted for product ${productId} in institution ${institutionId}`);
  }

  /**
   * Send low stock alert to canteen
   */
  public sendLowStockAlert(canteenId: string, productId: string, stockQuantity: number): void {
    this.io.to(`canteen:${canteenId}`).emit('product:low-stock', {
      productId,
      stockQuantity,
      timestamp: new Date().toISOString(),
    });

    console.log(`Low stock alert sent to canteen:${canteenId} for product ${productId}`);
  }

  /**
   * Broadcast bill expiration notification
   */
  public notifyBillExpiration(userId: string, orderId: string): void {
    this.io.to(`user:${userId}`).emit('bill:expired', {
      orderId,
      message: 'Your bill has expired. Please contact support or place a new order.',
      timestamp: new Date().toISOString(),
    });

    console.log(`Bill expiration notification sent to user ${userId} for order ${orderId}`);
  }

  /**
   * Get connection statistics
   */
  public getConnectionStats(): any {
    return this.connectionManager.getStats();
  }

  /**
   * Get Socket.io server instance
   */
  public getIO(): Server {
    return this.io;
  }

  /**
   * Close all connections and shutdown server
   */
  public async close(): Promise<void> {
    return new Promise((resolve) => {
      this.io.close(() => {
        console.log('WebSocket server closed');
        resolve();
      });
    });
  }
}
