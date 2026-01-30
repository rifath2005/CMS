import { Pool } from 'pg';
import { AuthService } from './AuthService';
import { UserRole } from '../../types';
import { getPool } from '../../config/database';
import { InstitutionModel } from '../../models/Institution';
import { redisHelpers, connectRedis, closeRedis } from '../../config/redis';

describe('AuthService', () => {
  let pool: Pool;
  let authService: AuthService;
  let institutionModel: InstitutionModel;
  let testInstitutionId: string;
  const testDomain = 'testuniversity.edu';

  beforeAll(async () => {
    pool = getPool();
    authService = new AuthService(pool);
    institutionModel = new InstitutionModel(pool);

    // Connect to Redis for session management tests
    await connectRedis();

    // Create a test institution for email validation
    const institution = await institutionModel.create(
      'Test University',
      testDomain,
      'contact@testuniversity.edu',
      '123-456-7890'
    );
    testInstitutionId = institution.id;
  });

  afterAll(async () => {
    // Clean up test institution
    await pool.query("DELETE FROM institutions WHERE email_domain = $1", [testDomain]);
    await pool.end();
    
    // Close Redis connection
    await closeRedis();
  });

  beforeEach(async () => {
    // Clean up test users before each test
    await pool.query("DELETE FROM users WHERE email LIKE '%@testuniversity.edu' AND email != 'admin@system.com'");
  });

  describe('register', () => {
    it('should register a new user with valid institutional email', async () => {
      const user = await authService.register(
        `authtest1@${testDomain}`,
        'password123',
        'Test User'
      );

      expect(user).toBeDefined();
      expect(user.email).toBe(`authtest1@${testDomain}`);
      expect(user.name).toBe('Test User');
      expect(user.role).toBe(UserRole.USER);
      expect(user.institutionId).toBe(testInstitutionId);
    });

    it('should register user with specified role', async () => {
      const user = await authService.register(
        `authtest2@${testDomain}`,
        'password123',
        'Vendor User',
        UserRole.VENDOR
      );

      expect(user.role).toBe(UserRole.VENDOR);
    });

    it('should throw error for invalid email domain (Requirement 1.2)', async () => {
      await expect(
        authService.register('authtest3@invaliddomain.com', 'password123', 'Test User')
      ).rejects.toThrow('Email domain is not registered with any institution');
    });

    it('should throw error for invalid email format', async () => {
      await expect(
        authService.register('invalid-email', 'password123', 'Test User')
      ).rejects.toThrow('Invalid email format');
    });

    it('should throw error for weak password', async () => {
      await expect(
        authService.register(`authtest4@${testDomain}`, 'weak', 'Test User')
      ).rejects.toThrow('Password must be at least 8 characters');
    });

    it('should throw error for password without numbers', async () => {
      await expect(
        authService.register(`authtest5@${testDomain}`, 'password', 'Test User')
      ).rejects.toThrow('Password must be at least 8 characters');
    });

    it('should throw error for password without letters', async () => {
      await expect(
        authService.register(`authtest6@${testDomain}`, '12345678', 'Test User')
      ).rejects.toThrow('Password must be at least 8 characters');
    });

    it('should throw error for duplicate email', async () => {
      await authService.register(
        `authtest7@${testDomain}`,
        'password123',
        'Test User'
      );

      await expect(
        authService.register(
          `authtest7@${testDomain}`,
          'password456',
          'Another User'
        )
      ).rejects.toThrow('Email already exists');
    });

    it('should store user with hashed password (Requirement 13.1)', async () => {
      const user = await authService.register(
        `authtest8@${testDomain}`,
        'password123',
        'Test User'
      );

      // Query database directly to check password is hashed
      const result = await pool.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [user.id]
      );

      expect(result.rows[0].password_hash).toBeDefined();
      expect(result.rows[0].password_hash).not.toBe('password123');
      expect(result.rows[0].password_hash).toMatch(/^\$2[aby]\$/); // bcrypt hash format
    });
  });

  describe('validateInstitutionalEmail', () => {
    it('should return true for valid institutional email (Requirement 1.1)', async () => {
      const isValid = await authService.validateInstitutionalEmail(`test@${testDomain}`);
      expect(isValid).toBe(true);
    });

    it('should return false for invalid institutional email domain (Requirement 1.2)', async () => {
      const isValid = await authService.validateInstitutionalEmail('test@invaliddomain.com');
      expect(isValid).toBe(false);
    });

    it('should return false for invalid email format', async () => {
      const isValid = await authService.validateInstitutionalEmail('invalid-email');
      expect(isValid).toBe(false);
    });

    it('should return false for empty email', async () => {
      const isValid = await authService.validateInstitutionalEmail('');
      expect(isValid).toBe(false);
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await authService.register(
        `authtest-login@${testDomain}`,
        'password123',
        'Test User'
      );
    });

    it('should login with valid credentials', async () => {
      const authToken = await authService.login(`authtest-login@${testDomain}`, 'password123');

      expect(authToken).toBeDefined();
      expect(authToken.token).toBeDefined();
      expect(authToken.expiresIn).toBeDefined();
      expect(authToken.user).toBeDefined();
      expect(authToken.user.email).toBe(`authtest-login@${testDomain}`);
    });

    it('should create session in Redis on login (Requirement 13.4)', async () => {
      const user = await authService.getUserByEmail(`authtest-login@${testDomain}`);
      const authToken = await authService.login(`authtest-login@${testDomain}`, 'password123');

      // Verify session exists in Redis
      const sessionData = await redisHelpers.getSession(user!.id);
      expect(sessionData).toBeDefined();
      expect(sessionData?.token).toBe(authToken.token);
      expect(sessionData?.role).toBe(user!.role);
      expect(sessionData?.institutionId).toBe(user!.institutionId);
      expect(sessionData?.expiresAt).toBeDefined();
    });

    it('should throw error for invalid email', async () => {
      await expect(
        authService.login(`nonexistent@${testDomain}`, 'password123')
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for invalid password', async () => {
      await expect(
        authService.login(`authtest-login@${testDomain}`, 'wrongpassword')
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('logout', () => {
    it('should remove session from Redis on logout (Requirement 13.4)', async () => {
      const user = await authService.register(
        `authtest-logout@${testDomain}`,
        'password123',
        'Test User'
      );

      // Login to create session
      await authService.login(`authtest-logout@${testDomain}`, 'password123');

      // Verify session exists
      let sessionData = await redisHelpers.getSession(user.id);
      expect(sessionData).toBeDefined();

      // Logout
      const result = await authService.logout(user.id);
      expect(result).toBe(true);

      // Verify session is removed
      sessionData = await redisHelpers.getSession(user.id);
      expect(sessionData).toBeNull();
    });

    it('should succeed even if session does not exist', async () => {
      const result = await authService.logout('00000000-0000-0000-0000-000000000999');
      expect(result).toBe(true);
    });
  });

  describe('getSession', () => {
    it('should retrieve session data from Redis (Requirement 13.4)', async () => {
      const user = await authService.register(
        `authtest-getsession@${testDomain}`,
        'password123',
        'Test User'
      );

      const authToken = await authService.login(`authtest-getsession@${testDomain}`, 'password123');

      const sessionData = await authService.getSession(user.id);
      expect(sessionData).toBeDefined();
      expect(sessionData?.token).toBe(authToken.token);
      expect(sessionData?.role).toBe(user.role);
      expect(sessionData?.institutionId).toBe(user.institutionId);
    });

    it('should return null for non-existent session', async () => {
      const sessionData = await authService.getSession('00000000-0000-0000-0000-000000000999');
      expect(sessionData).toBeNull();
    });

    it('should return null and remove expired session (Requirement 13.4)', async () => {
      const user = await authService.register(
        `authtest-expired@${testDomain}`,
        'password123',
        'Test User'
      );

      // Create an expired session manually
      const expiredDate = new Date();
      expiredDate.setSeconds(expiredDate.getSeconds() - 10); // 10 seconds ago

      await redisHelpers.setSession(user.id, {
        token: 'expired-token',
        role: user.role,
        institutionId: user.institutionId,
        expiresAt: expiredDate,
      }, 1); // 1 second TTL

      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 1100));

      const sessionData = await authService.getSession(user.id);
      expect(sessionData).toBeNull();
    });
  });

  describe('verifySession', () => {
    it('should verify valid session (Requirement 13.4)', async () => {
      const user = await authService.register(
        `authtest-verifysession@${testDomain}`,
        'password123',
        'Test User'
      );

      const authToken = await authService.login(`authtest-verifysession@${testDomain}`, 'password123');

      const isValid = await authService.verifySession(user.id, authToken.token);
      expect(isValid).toBe(true);
    });

    it('should return false for non-existent session', async () => {
      const isValid = await authService.verifySession('00000000-0000-0000-0000-000000000999', 'fake-token');
      expect(isValid).toBe(false);
    });

    it('should return false for mismatched token', async () => {
      const user = await authService.register(
        `authtest-mismatch@${testDomain}`,
        'password123',
        'Test User'
      );

      await authService.login(`authtest-mismatch@${testDomain}`, 'password123');

      const isValid = await authService.verifySession(user.id, 'wrong-token');
      expect(isValid).toBe(false);
    });

    it('should return false and remove session for invalid JWT token', async () => {
      const user = await authService.register(
        `authtest-invalidjwt@${testDomain}`,
        'password123',
        'Test User'
      );

      // Create session with invalid token
      await redisHelpers.setSession(user.id, {
        token: 'invalid-jwt-token',
        role: user.role,
        institutionId: user.institutionId,
        expiresAt: new Date(Date.now() + 86400000),
      }, 86400);

      const isValid = await authService.verifySession(user.id, 'invalid-jwt-token');
      expect(isValid).toBe(false);

      // Verify session was removed
      const sessionData = await redisHelpers.getSession(user.id);
      expect(sessionData).toBeNull();
    });
  });

  describe('refreshSession', () => {
    it('should refresh session and extend TTL (Requirement 13.4)', async () => {
      const user = await authService.register(
        `authtest-refresh@${testDomain}`,
        'password123',
        'Test User'
      );

      await authService.login(`authtest-refresh@${testDomain}`, 'password123');

      // Get initial session
      const initialSession = await authService.getSession(user.id);
      expect(initialSession).toBeDefined();

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Refresh session
      const refreshedSession = await authService.refreshSession(user.id);
      expect(refreshedSession).toBeDefined();
      expect(refreshedSession?.expiresAt).toBeDefined();

      // Verify new expiration is later than initial
      const initialExpiry = new Date(initialSession!.expiresAt).getTime();
      const refreshedExpiry = new Date(refreshedSession!.expiresAt).getTime();
      expect(refreshedExpiry).toBeGreaterThan(initialExpiry);
    });

    it('should return null for non-existent session', async () => {
      const refreshedSession = await authService.refreshSession('00000000-0000-0000-0000-000000000999');
      expect(refreshedSession).toBeNull();
    });
  });

  describe('verifyTokenAndGetUser', () => {
    it('should verify token and return user', async () => {
      const registeredUser = await authService.register(
        `authtest9@${testDomain}`,
        'password123',
        'Test User'
      );

      const authToken = await authService.login(`authtest9@${testDomain}`, 'password123');
      const user = await authService.verifyTokenAndGetUser(authToken.token);

      expect(user).toBeDefined();
      expect(user.id).toBe(registeredUser.id);
      expect(user.email).toBe(registeredUser.email);
    });

    it('should throw error for invalid token', async () => {
      await expect(authService.verifyTokenAndGetUser('invalid-token')).rejects.toThrow();
    });
  });

  describe('assignRole', () => {
    it('should assign role to user', async () => {
      const user = await authService.register(
        `authtest10@${testDomain}`,
        'password123',
        'Test User'
      );

      const updatedUser = await authService.assignRole(user.id, UserRole.VENDOR);

      expect(updatedUser.role).toBe(UserRole.VENDOR);
    });
  });

  describe('changePassword', () => {
    it('should change password with valid old password', async () => {
      const user = await authService.register(
        `authtest11@${testDomain}`,
        'password123',
        'Test User'
      );

      const result = await authService.changePassword(user.id, 'password123', 'newpassword456');
      expect(result).toBe(true);

      // Verify new password works
      const authToken = await authService.login(`authtest11@${testDomain}`, 'newpassword456');
      expect(authToken).toBeDefined();
    });

    it('should throw error for incorrect old password', async () => {
      const user = await authService.register(
        `authtest12@${testDomain}`,
        'password123',
        'Test User'
      );

      await expect(
        authService.changePassword(user.id, 'wrongpassword', 'newpassword456')
      ).rejects.toThrow('Current password is incorrect');
    });

    it('should throw error for weak new password', async () => {
      const user = await authService.register(
        `authtest13@${testDomain}`,
        'password123',
        'Test User'
      );

      await expect(authService.changePassword(user.id, 'password123', 'weak')).rejects.toThrow(
        'Password must be at least 8 characters'
      );
    });

    it('should throw error for non-existent user', async () => {
      await expect(
        authService.changePassword(
          '00000000-0000-0000-0000-000000000999',
          'password123',
          'newpassword456'
        )
      ).rejects.toThrow('User not found');
    });
  });

  describe('getUserById', () => {
    it('should get user by ID', async () => {
      const registeredUser = await authService.register(
        `authtest14@${testDomain}`,
        'password123',
        'Test User'
      );

      const user = await authService.getUserById(registeredUser.id);

      expect(user).toBeDefined();
      expect(user?.id).toBe(registeredUser.id);
      expect(user?.email).toBe(registeredUser.email);
    });

    it('should return null for non-existent user', async () => {
      const user = await authService.getUserById('00000000-0000-0000-0000-000000000999');
      expect(user).toBeNull();
    });
  });

  describe('getUserByEmail', () => {
    it('should get user by email', async () => {
      const registeredUser = await authService.register(
        `authtest15@${testDomain}`,
        'password123',
        'Test User'
      );

      const user = await authService.getUserByEmail(`authtest15@${testDomain}`);

      expect(user).toBeDefined();
      expect(user?.id).toBe(registeredUser.id);
      expect(user?.email).toBe(registeredUser.email);
    });

    it('should return null for non-existent email', async () => {
      const user = await authService.getUserByEmail(`nonexistent@${testDomain}`);
      expect(user).toBeNull();
    });
  });
});
