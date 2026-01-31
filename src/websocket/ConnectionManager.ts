import { Socket } from 'socket.io';
import { UserRole } from '../types';
import { AuthenticatedSocket } from './WebSocketServer';

interface ConnectionInfo {
  socketId: string;
  userId: string;
  role: UserRole;
  institutionId?: string;
  vendorId?: string;
  connectedAt: Date;
}

/**
 * Manages WebSocket connections and provides utilities for connection tracking
 */
export class ConnectionManager {
  private connections: Map<string, ConnectionInfo>;
  private userSockets: Map<string, Set<string>>; // userId -> Set of socketIds

  constructor() {
    this.connections = new Map();
    this.userSockets = new Map();
  }

  /**
   * Add a new connection
   */
  public addConnection(socket: AuthenticatedSocket): void {
    if (!socket.userId || !socket.role) {
      console.warn(`Cannot add connection ${socket.id}: missing user info`);
      return;
    }

    const connectionInfo: ConnectionInfo = {
      socketId: socket.id,
      userId: socket.userId,
      role: socket.role,
      institutionId: socket.institutionId,
      vendorId: socket.vendorId,
      connectedAt: new Date(),
    };

    // Store connection info
    this.connections.set(socket.id, connectionInfo);

    // Track user's sockets
    if (!this.userSockets.has(socket.userId)) {
      this.userSockets.set(socket.userId, new Set());
    }
    this.userSockets.get(socket.userId)!.add(socket.id);

    console.log(`Connection added: ${socket.id} for user ${socket.userId}`);
  }

  /**
   * Remove a connection
   */
  public removeConnection(socketId: string): void {
    const connectionInfo = this.connections.get(socketId);
    
    if (connectionInfo) {
      // Remove from user sockets tracking
      const userSocketSet = this.userSockets.get(connectionInfo.userId);
      if (userSocketSet) {
        userSocketSet.delete(socketId);
        
        // Clean up empty sets
        if (userSocketSet.size === 0) {
          this.userSockets.delete(connectionInfo.userId);
        }
      }

      // Remove connection info
      this.connections.delete(socketId);
      console.log(`Connection removed: ${socketId}`);
    }
  }

  /**
   * Get connection info by socket ID
   */
  public getConnection(socketId: string): ConnectionInfo | undefined {
    return this.connections.get(socketId);
  }

  /**
   * Get all socket IDs for a specific user
   */
  public getUserSockets(userId: string): string[] {
    const socketSet = this.userSockets.get(userId);
    return socketSet ? Array.from(socketSet) : [];
  }

  /**
   * Check if a user is currently connected
   */
  public isUserConnected(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return sockets !== undefined && sockets.size > 0;
  }

  /**
   * Get all connections for a specific role
   */
  public getConnectionsByRole(role: UserRole): ConnectionInfo[] {
    return Array.from(this.connections.values()).filter(
      (conn) => conn.role === role
    );
  }

  /**
   * Get all connections for a specific institution
   */
  public getConnectionsByInstitution(institutionId: string): ConnectionInfo[] {
    return Array.from(this.connections.values()).filter(
      (conn) => conn.institutionId === institutionId
    );
  }

  /**
   * Get all connections for a specific vendor
   */
  public getConnectionsByVendor(vendorId: string): ConnectionInfo[] {
    return Array.from(this.connections.values()).filter(
      (conn) => conn.vendorId === vendorId
    );
  }

  /**
   * Get connection statistics
   */
  public getStats(): {
    totalConnections: number;
    uniqueUsers: number;
    connectionsByRole: Record<string, number>;
    averageConnectionsPerUser: number;
  } {
    const connectionsByRole: Record<string, number> = {};

    // Count connections by role
    for (const conn of this.connections.values()) {
      connectionsByRole[conn.role] = (connectionsByRole[conn.role] || 0) + 1;
    }

    const totalConnections = this.connections.size;
    const uniqueUsers = this.userSockets.size;

    return {
      totalConnections,
      uniqueUsers,
      connectionsByRole,
      averageConnectionsPerUser: uniqueUsers > 0 ? totalConnections / uniqueUsers : 0,
    };
  }

  /**
   * Get all active connections (for debugging)
   */
  public getAllConnections(): ConnectionInfo[] {
    return Array.from(this.connections.values());
  }

  /**
   * Clear all connections (for testing/cleanup)
   */
  public clearAll(): void {
    this.connections.clear();
    this.userSockets.clear();
    console.log('All connections cleared');
  }

  /**
   * Get connection duration for a socket
   */
  public getConnectionDuration(socketId: string): number | null {
    const conn = this.connections.get(socketId);
    if (!conn) return null;

    return Date.now() - conn.connectedAt.getTime();
  }

  /**
   * Get stale connections (connected for more than specified duration)
   */
  public getStaleConnections(maxDurationMs: number): ConnectionInfo[] {
    const now = Date.now();
    return Array.from(this.connections.values()).filter(
      (conn) => now - conn.connectedAt.getTime() > maxDurationMs
    );
  }
}
