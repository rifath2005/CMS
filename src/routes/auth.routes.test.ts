import request from 'supertest';
import express, { Application } from 'express';
import { Pool } from 'pg';
import { createAuthRouter } from './auth.routes';
import { getPool } from '../config/database';
import { InstitutionModel } from '../models/Institution';
import { connectRedis, closeRedis, redisHelpers } from '../config/redis';

describe('Auth Routes', () => {
  let app: Application;
  let pool: Pool;
  let institutionModel: InstitutionModel;
  let testInstitutionId: string;
  const testDomain = 'testroutes.edu';

  beforeAll(async () => {
    pool = getPool();
    institutionModel = new InstitutionModel(pool);

    // Connect to Redis for session management tests
    await connectRedis();

    // Create test institution
    const institution = await institutionModel.create(
      'Test Routes University',
      testDomain,
      'contact@testroutes.edu'
    );
    testInstitutionId = institution.id;

    // Setup Express app with auth routes
    app = express();
    app.use(express.json());
    app.use('/api/v1/auth', createAuthRouter(pool));
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
    await pool.query("DELETE FROM users WHERE email LIKE $1", [`%@${testDomain}`]);
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user with valid institutional email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `testuser1@${testDomain}`,
          password: 'password123',
          name: 'Test User',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(`testuser1@${testDomain}`);
      expect(response.body.data.user.name).toBe('Test User');
      expect(response.body.data.user.role).toBe('USER');
      expect(response.body.data.user.institutionId).toBe(testInstitutionId);
      expect(response.body.data.message).toBe('Registration successful');
    });

    it('should reject registration with invalid email domain (Requirement 1.2)', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'testuser@invaliddomain.com',
          password: 'password123',
          name: 'Test User',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_EMAIL_DOMAIN');
      expect(response.body.error.message).toContain('Email domain is not registered');
    });

    it('should reject registration with invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          name: 'Test User',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid email format');
    });

    it('should reject registration with weak password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `testuser2@${testDomain}`,
          password: 'weak',
          name: 'Test User',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('WEAK_PASSWORD');
      expect(response.body.error.message).toContain('Password must be');
    });

    it('should reject registration with missing fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `testuser3@${testDomain}`,
          password: 'password123',
          // name is missing
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject registration with duplicate email', async () => {
      // First registration
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `testuser4@${testDomain}`,
          password: 'password123',
          name: 'Test User',
        })
        .expect(201);

      // Duplicate registration
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `testuser4@${testDomain}`,
          password: 'password456',
          name: 'Another User',
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('EMAIL_EXISTS');
    });

    it('should trim and lowercase email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `  TestUser5@${testDomain}  `,
          password: 'password123',
          name: 'Test User',
        })
        .expect(201);

      expect(response.body.data.user.email).toBe(`testuser5@${testDomain}`);
    });

    it('should trim name', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `testuser6@${testDomain}`,
          password: 'password123',
          name: '  Test User  ',
        })
        .expect(201);

      expect(response.body.data.user.name).toBe('Test User');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      // Register a test user
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `loginuser@${testDomain}`,
          password: 'password123',
          name: 'Login Test User',
        });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: `loginuser@${testDomain}`,
          password: 'password123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.expiresIn).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(`loginuser@${testDomain}`);
    });

    it('should reject login with invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: `nonexistent@${testDomain}`,
          password: 'password123',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject login with invalid password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: `loginuser@${testDomain}`,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should reject login with missing fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: `loginuser@${testDomain}`,
          // password is missing
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/validate-email', () => {
    it('should return true for valid institutional email (Requirement 1.1)', async () => {
      const response = await request(app)
        .post('/api/v1/auth/validate-email')
        .send({
          email: `student@${testDomain}`,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(true);
      expect(response.body.data.message).toContain('registered');
    });

    it('should return false for invalid institutional email domain (Requirement 1.2)', async () => {
      const response = await request(app)
        .post('/api/v1/auth/validate-email')
        .send({
          email: 'student@invaliddomain.com',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(false);
      expect(response.body.data.message).toContain('not registered');
    });

    it('should return false for invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/validate-email')
        .send({
          email: 'invalid-email',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(false);
    });

    it('should reject request with missing email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/validate-email')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should trim and lowercase email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/validate-email')
        .send({
          email: `  Student@${testDomain}  `,
        })
        .expect(200);

      expect(response.body.data.email).toBe(`student@${testDomain}`);
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout user and remove session from Redis (Requirement 13.4)', async () => {
      // Register and login
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `logoutuser@${testDomain}`,
          password: 'password123',
          name: 'Logout Test User',
        });

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: `logoutuser@${testDomain}`,
          password: 'password123',
        });

      const userId = loginResponse.body.data.user.id;

      // Verify session exists
      let sessionData = await redisHelpers.getSession(userId);
      expect(sessionData).toBeDefined();

      // Logout
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .send({ userId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Logout successful');

      // Verify session is removed
      sessionData = await redisHelpers.getSession(userId);
      expect(sessionData).toBeNull();
    });

    it('should reject logout with missing userId', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should succeed even if session does not exist', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout')
        .send({ userId: '00000000-0000-0000-0000-000000000999' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/v1/auth/verify-session', () => {
    it('should verify valid session (Requirement 13.4)', async () => {
      // Register and login
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `verifyuser@${testDomain}`,
          password: 'password123',
          name: 'Verify Test User',
        });

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: `verifyuser@${testDomain}`,
          password: 'password123',
        });

      const userId = loginResponse.body.data.user.id;
      const token = loginResponse.body.data.token;

      // Verify session
      const response = await request(app)
        .post('/api/v1/auth/verify-session')
        .send({ userId, token })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(true);
      expect(response.body.data.message).toContain('valid');
    });

    it('should return false for non-existent session', async () => {
      const response = await request(app)
        .post('/api/v1/auth/verify-session')
        .send({
          userId: '00000000-0000-0000-0000-000000000999',
          token: 'fake-token',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(false);
    });

    it('should return false for mismatched token', async () => {
      // Register and login
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `mismatchuser@${testDomain}`,
          password: 'password123',
          name: 'Mismatch Test User',
        });

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: `mismatchuser@${testDomain}`,
          password: 'password123',
        });

      const userId = loginResponse.body.data.user.id;

      // Verify with wrong token
      const response = await request(app)
        .post('/api/v1/auth/verify-session')
        .send({ userId, token: 'wrong-token' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isValid).toBe(false);
    });

    it('should reject request with missing fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/verify-session')
        .send({ userId: 'some-id' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/refresh-session', () => {
    it('should refresh session and extend TTL (Requirement 13.4)', async () => {
      // Register and login
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `refreshuser@${testDomain}`,
          password: 'password123',
          name: 'Refresh Test User',
        });

      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: `refreshuser@${testDomain}`,
          password: 'password123',
        });

      const userId = loginResponse.body.data.user.id;

      // Get initial session
      const initialSession = await redisHelpers.getSession(userId);
      expect(initialSession).toBeDefined();

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Refresh session
      const response = await request(app)
        .post('/api/v1/auth/refresh-session')
        .send({ userId })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('refreshed');
      expect(response.body.data.expiresAt).toBeDefined();

      // Verify new expiration is later
      const initialExpiry = new Date(initialSession!.expiresAt).getTime();
      const refreshedExpiry = new Date(response.body.data.expiresAt).getTime();
      expect(refreshedExpiry).toBeGreaterThan(initialExpiry);
    });

    it('should return 404 for non-existent session', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh-session')
        .send({ userId: '00000000-0000-0000-0000-000000000999' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('SESSION_NOT_FOUND');
    });

    it('should reject request with missing userId', async () => {
      const response = await request(app)
        .post('/api/v1/auth/refresh-session')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
