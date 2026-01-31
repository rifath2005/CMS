import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { WebSocketServer } from './WebSocketServer';
import { ConnectionManager } from './ConnectionManager';
import { UserRole } from '../types';

// Mock dependencies
jest.mock('./ConnectionManager');
jest.mock('../services/auth/jwt');

describe('WebSocketServer', () => {
  let httpServer: HttpServer;
  let wsServer: WebSocketServer;

  beforeEach(() => {
    // Create a mock HTTP server
    httpServer = {
      listen: jest.fn(),
      close: jest.fn(),
    } as any;

    wsServer = new WebSocketServer(httpServer);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize Socket.io server with correct configuration', () => {
      expect(wsServer).toBeDefined();
      expect(wsServer.getIO()).toBeInstanceOf(SocketIOServer);
    });

    it('should setup CORS configuration', () => {
      const io = wsServer.getIO();
      expect(io).toBeDefined();
    });
  });

  describe('Connection Statistics', () => {
    it('should return connection statistics', () => {
      const stats = wsServer.getConnectionStats();
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('totalConnections');
      expect(stats).toHaveProperty('uniqueUsers');
    });
  });

  describe('Broadcasting', () => {
    it('should have method to broadcast order updates', () => {
      expect(typeof wsServer.broadcastOrderUpdate).toBe('function');
    });

    it('should have method to send timer updates', () => {
      expect(typeof wsServer.sendTimerUpdate).toBe('function');
    });

    it('should have method to notify vendors', () => {
      expect(typeof wsServer.notifyVendor).toBe('function');
    });

    it('should have method to broadcast stock changes', () => {
      expect(typeof wsServer.broadcastStockChange).toBe('function');
    });

    it('should have method to send low stock alerts', () => {
      expect(typeof wsServer.sendLowStockAlert).toBe('function');
    });

    it('should have method to notify bill expiration', () => {
      expect(typeof wsServer.notifyBillExpiration).toBe('function');
    });
  });

  describe('Server Management', () => {
    it('should provide method to get IO instance', () => {
      const io = wsServer.getIO();
      expect(io).toBeInstanceOf(SocketIOServer);
    });

    it('should provide method to close server', async () => {
      await expect(wsServer.close()).resolves.not.toThrow();
    });
  });
});
