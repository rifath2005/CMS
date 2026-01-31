import { ConnectionManager } from './ConnectionManager';
import { UserRole } from '../types';
import { AuthenticatedSocket } from './WebSocketServer';

describe('ConnectionManager', () => {
  let connectionManager: ConnectionManager;
  let mockSocket: AuthenticatedSocket;

  beforeEach(() => {
    connectionManager = new ConnectionManager();
    
    // Create mock socket
    mockSocket = {
      id: 'socket-123',
      userId: 'user-456',
      role: UserRole.USER,
      institutionId: 'inst-789',
      join: jest.fn(),
      emit: jest.fn(),
      on: jest.fn(),
    } as any;
  });

  afterEach(() => {
    connectionManager.clearAll();
  });

  describe('Connection Management', () => {
    it('should add a connection', () => {
      connectionManager.addConnection(mockSocket);
      
      const connection = connectionManager.getConnection(mockSocket.id);
      expect(connection).toBeDefined();
      expect(connection?.userId).toBe('user-456');
      expect(connection?.role).toBe(UserRole.USER);
    });

    it('should not add connection without user info', () => {
      const invalidSocket = { id: 'socket-999' } as any;
      connectionManager.addConnection(invalidSocket);
      
      const connection = connectionManager.getConnection('socket-999');
      expect(connection).toBeUndefined();
    });

    it('should remove a connection', () => {
      connectionManager.addConnection(mockSocket);
      expect(connectionManager.getConnection(mockSocket.id)).toBeDefined();
      
      connectionManager.removeConnection(mockSocket.id);
      expect(connectionManager.getConnection(mockSocket.id)).toBeUndefined();
    });

    it('should track multiple sockets for same user', () => {
      const socket1 = { ...mockSocket, id: 'socket-1' } as any;
      const socket2 = { ...mockSocket, id: 'socket-2' } as any;
      
      connectionManager.addConnection(socket1);
      connectionManager.addConnection(socket2);
      
      const userSockets = connectionManager.getUserSockets('user-456');
      expect(userSockets).toHaveLength(2);
      expect(userSockets).toContain('socket-1');
      expect(userSockets).toContain('socket-2');
    });
  });

  describe('User Connection Status', () => {
    it('should check if user is connected', () => {
      expect(connectionManager.isUserConnected('user-456')).toBe(false);
      
      connectionManager.addConnection(mockSocket);
      expect(connectionManager.isUserConnected('user-456')).toBe(true);
      
      connectionManager.removeConnection(mockSocket.id);
      expect(connectionManager.isUserConnected('user-456')).toBe(false);
    });

    it('should return empty array for disconnected user', () => {
      const sockets = connectionManager.getUserSockets('non-existent-user');
      expect(sockets).toEqual([]);
    });
  });

  describe('Filtering Connections', () => {
    beforeEach(() => {
      // Add multiple connections with different roles
      const userSocket = { ...mockSocket, id: 'user-1', role: UserRole.USER } as any;
      const vendorSocket = { ...mockSocket, id: 'vendor-1', userId: 'vendor-user', role: UserRole.VENDOR, vendorId: 'vendor-123' } as any;
      const adminSocket = { ...mockSocket, id: 'admin-1', userId: 'admin-user', role: UserRole.INSTITUTION_ADMIN } as any;
      
      connectionManager.addConnection(userSocket);
      connectionManager.addConnection(vendorSocket);
      connectionManager.addConnection(adminSocket);
    });

    it('should get connections by role', () => {
      const userConnections = connectionManager.getConnectionsByRole(UserRole.USER);
      expect(userConnections).toHaveLength(1);
      expect(userConnections[0].role).toBe(UserRole.USER);
      
      const vendorConnections = connectionManager.getConnectionsByRole(UserRole.VENDOR);
      expect(vendorConnections).toHaveLength(1);
      expect(vendorConnections[0].role).toBe(UserRole.VENDOR);
    });

    it('should get connections by institution', () => {
      const institutionConnections = connectionManager.getConnectionsByInstitution('inst-789');
      expect(institutionConnections.length).toBeGreaterThan(0);
      institutionConnections.forEach(conn => {
        expect(conn.institutionId).toBe('inst-789');
      });
    });

    it('should get connections by vendor', () => {
      const vendorConnections = connectionManager.getConnectionsByVendor('vendor-123');
      expect(vendorConnections).toHaveLength(1);
      expect(vendorConnections[0].vendorId).toBe('vendor-123');
    });
  });

  describe('Statistics', () => {
    it('should return correct statistics', () => {
      connectionManager.addConnection(mockSocket);
      
      const stats = connectionManager.getStats();
      expect(stats.totalConnections).toBe(1);
      expect(stats.uniqueUsers).toBe(1);
      expect(stats.connectionsByRole[UserRole.USER]).toBe(1);
      expect(stats.averageConnectionsPerUser).toBe(1);
    });

    it('should calculate average connections per user correctly', () => {
      const socket1 = { ...mockSocket, id: 'socket-1' } as any;
      const socket2 = { ...mockSocket, id: 'socket-2' } as any;
      
      connectionManager.addConnection(socket1);
      connectionManager.addConnection(socket2);
      
      const stats = connectionManager.getStats();
      expect(stats.totalConnections).toBe(2);
      expect(stats.uniqueUsers).toBe(1);
      expect(stats.averageConnectionsPerUser).toBe(2);
    });
  });

  describe('Connection Duration', () => {
    it('should track connection duration', (done) => {
      connectionManager.addConnection(mockSocket);
      
      setTimeout(() => {
        const duration = connectionManager.getConnectionDuration(mockSocket.id);
        expect(duration).toBeGreaterThan(0);
        done();
      }, 10);
    });

    it('should return null for non-existent connection', () => {
      const duration = connectionManager.getConnectionDuration('non-existent');
      expect(duration).toBeNull();
    });

    it('should identify stale connections', (done) => {
      connectionManager.addConnection(mockSocket);
      
      setTimeout(() => {
        const staleConnections = connectionManager.getStaleConnections(5);
        expect(staleConnections.length).toBeGreaterThan(0);
        done();
      }, 10);
    });
  });

  describe('Cleanup', () => {
    it('should clear all connections', () => {
      connectionManager.addConnection(mockSocket);
      expect(connectionManager.getStats().totalConnections).toBe(1);
      
      connectionManager.clearAll();
      expect(connectionManager.getStats().totalConnections).toBe(0);
    });

    it('should get all connections', () => {
      connectionManager.addConnection(mockSocket);
      
      const allConnections = connectionManager.getAllConnections();
      expect(allConnections).toHaveLength(1);
      expect(allConnections[0].socketId).toBe(mockSocket.id);
    });
  });
});
