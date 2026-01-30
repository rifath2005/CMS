import { generateToken, verifyToken, decodeToken, isTokenExpired } from './jwt';
import { User, UserRole } from '../../types';

describe('JWT Utilities', () => {
  const mockUser: User = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    name: 'Test User',
    role: UserRole.USER,
    institutionId: '123e4567-e89b-12d3-a456-426614174001',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const authToken = generateToken(mockUser);

      expect(authToken).toBeDefined();
      expect(authToken.token).toBeDefined();
      expect(authToken.expiresIn).toBeDefined();
      expect(authToken.user).toBeDefined();
      expect(authToken.user.id).toBe(mockUser.id);
      expect(authToken.user.email).toBe(mockUser.email);
      expect(authToken.user.role).toBe(mockUser.role);
    });

    it('should not include createdAt and updatedAt in user object', () => {
      const authToken = generateToken(mockUser);

      expect(authToken.user).not.toHaveProperty('createdAt');
      expect(authToken.user).not.toHaveProperty('updatedAt');
    });
  });

  describe('verifyToken', () => {
    it('should verify and decode a valid token', () => {
      const authToken = generateToken(mockUser);
      const payload = verifyToken(authToken.token);

      expect(payload).toBeDefined();
      expect(payload.userId).toBe(mockUser.id);
      expect(payload.email).toBe(mockUser.email);
      expect(payload.role).toBe(mockUser.role);
      expect(payload.institutionId).toBe(mockUser.institutionId);
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyToken('invalid-token')).toThrow('Invalid token');
    });

    it('should throw error for empty token', () => {
      expect(() => verifyToken('')).toThrow();
    });

    it('should throw error for malformed token', () => {
      expect(() => verifyToken('Bearer invalid.token.here')).toThrow('Invalid token');
    });
  });

  describe('decodeToken', () => {
    it('should decode a valid token without verification', () => {
      const authToken = generateToken(mockUser);
      const payload = decodeToken(authToken.token);

      expect(payload).toBeDefined();
      expect(payload?.userId).toBe(mockUser.id);
      expect(payload?.email).toBe(mockUser.email);
    });

    it('should return null for invalid token', () => {
      const payload = decodeToken('invalid-token');
      expect(payload).toBeNull();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid non-expired token', () => {
      const authToken = generateToken(mockUser);
      const expired = isTokenExpired(authToken.token);

      expect(expired).toBe(false);
    });

    it('should return false for invalid token (not expired, just invalid)', () => {
      const expired = isTokenExpired('invalid-token');
      expect(expired).toBe(false);
    });
  });

  describe('Token payload structure', () => {
    it('should include all required fields in payload', () => {
      const authToken = generateToken(mockUser);
      const payload = verifyToken(authToken.token);

      expect(payload).toHaveProperty('userId');
      expect(payload).toHaveProperty('email');
      expect(payload).toHaveProperty('role');
      expect(payload).toHaveProperty('institutionId');
    });

    it('should handle different user roles', () => {
      const roles = [UserRole.USER, UserRole.VENDOR, UserRole.INSTITUTION_ADMIN, UserRole.MAIN_ADMIN];

      roles.forEach((role) => {
        const user = { ...mockUser, role };
        const authToken = generateToken(user);
        const payload = verifyToken(authToken.token);

        expect(payload.role).toBe(role);
      });
    });
  });
});
