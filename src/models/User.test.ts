import { UserModel } from './User';
import { UserRole } from '../types';
import { pool } from '../config/database';

describe('UserModel', () => {
  let userModel: UserModel;
  const testInstitutionId = '00000000-0000-0000-0000-000000000001';

  beforeAll(async () => {
    userModel = new UserModel(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    // Clean up test users before each test
    await pool.query("DELETE FROM users WHERE email LIKE 'test%@example.com'");
  });

  describe('create', () => {
    it('should create a new user with hashed password', async () => {
      const user = await userModel.create(
        'test1@example.com',
        'password123',
        'Test User',
        UserRole.USER,
        testInstitutionId
      );

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBe('test1@example.com');
      expect(user.name).toBe('Test User');
      expect(user.role).toBe(UserRole.USER);
      expect(user.institutionId).toBe(testInstitutionId);
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    it('should throw error for duplicate email', async () => {
      await userModel.create(
        'test2@example.com',
        'password123',
        'Test User',
        UserRole.USER,
        testInstitutionId
      );

      await expect(
        userModel.create(
          'test2@example.com',
          'password456',
          'Another User',
          UserRole.USER,
          testInstitutionId
        )
      ).rejects.toThrow('Email already exists');
    });

    it('should create users with different roles', async () => {
      const roles = [UserRole.USER, UserRole.VENDOR, UserRole.INSTITUTION_ADMIN];

      for (let i = 0; i < roles.length; i++) {
        const user = await userModel.create(
          `test-role-${i}@example.com`,
          'password123',
          `Test User ${i}`,
          roles[i],
          testInstitutionId
        );

        expect(user.role).toBe(roles[i]);
      }
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const createdUser = await userModel.create(
        'test3@example.com',
        'password123',
        'Test User',
        UserRole.USER,
        testInstitutionId
      );

      const foundUser = await userModel.findByEmail('test3@example.com');

      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(createdUser.id);
      expect(foundUser?.email).toBe(createdUser.email);
    });

    it('should return null for non-existent email', async () => {
      const user = await userModel.findByEmail('nonexistent@example.com');
      expect(user).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find user by ID', async () => {
      const createdUser = await userModel.create(
        'test4@example.com',
        'password123',
        'Test User',
        UserRole.USER,
        testInstitutionId
      );

      const foundUser = await userModel.findById(createdUser.id);

      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(createdUser.id);
      expect(foundUser?.email).toBe(createdUser.email);
    });

    it('should return null for non-existent ID', async () => {
      const user = await userModel.findById('00000000-0000-0000-0000-000000000999');
      expect(user).toBeNull();
    });
  });

  describe('verifyCredentials', () => {
    it('should return user for valid credentials', async () => {
      await userModel.create(
        'test5@example.com',
        'password123',
        'Test User',
        UserRole.USER,
        testInstitutionId
      );

      const user = await userModel.verifyCredentials('test5@example.com', 'password123');

      expect(user).toBeDefined();
      expect(user?.email).toBe('test5@example.com');
      expect(user).not.toHaveProperty('password_hash');
    });

    it('should return null for invalid password', async () => {
      await userModel.create(
        'test6@example.com',
        'password123',
        'Test User',
        UserRole.USER,
        testInstitutionId
      );

      const user = await userModel.verifyCredentials('test6@example.com', 'wrongpassword');

      expect(user).toBeNull();
    });

    it('should return null for non-existent email', async () => {
      const user = await userModel.verifyCredentials('nonexistent@example.com', 'password123');
      expect(user).toBeNull();
    });
  });

  describe('updateRole', () => {
    it('should update user role', async () => {
      const user = await userModel.create(
        'test7@example.com',
        'password123',
        'Test User',
        UserRole.USER,
        testInstitutionId
      );

      const updatedUser = await userModel.updateRole(user.id, UserRole.VENDOR);

      expect(updatedUser.role).toBe(UserRole.VENDOR);
      expect(updatedUser.id).toBe(user.id);
    });

    it('should throw error for non-existent user', async () => {
      await expect(
        userModel.updateRole('00000000-0000-0000-0000-000000000999', UserRole.VENDOR)
      ).rejects.toThrow('User not found');
    });
  });

  describe('updatePassword', () => {
    it('should update user password', async () => {
      const user = await userModel.create(
        'test8@example.com',
        'password123',
        'Test User',
        UserRole.USER,
        testInstitutionId
      );

      const result = await userModel.updatePassword(user.id, 'newpassword456');
      expect(result).toBe(true);

      // Verify new password works
      const verifiedUser = await userModel.verifyCredentials('test8@example.com', 'newpassword456');
      expect(verifiedUser).toBeDefined();

      // Verify old password doesn't work
      const oldPasswordUser = await userModel.verifyCredentials('test8@example.com', 'password123');
      expect(oldPasswordUser).toBeNull();
    });

    it('should return false for non-existent user', async () => {
      const result = await userModel.updatePassword(
        '00000000-0000-0000-0000-000000000999',
        'newpassword'
      );
      expect(result).toBe(false);
    });
  });

  describe('updateProfile', () => {
    it('should update user name', async () => {
      const user = await userModel.create(
        'test9@example.com',
        'password123',
        'Test User',
        UserRole.USER,
        testInstitutionId
      );

      const updatedUser = await userModel.updateProfile(user.id, 'Updated Name');

      expect(updatedUser.name).toBe('Updated Name');
      expect(updatedUser.id).toBe(user.id);
      expect(updatedUser.email).toBe(user.email);
    });

    it('should throw error for non-existent user', async () => {
      await expect(
        userModel.updateProfile('00000000-0000-0000-0000-000000000999', 'New Name')
      ).rejects.toThrow('User not found');
    });
  });

  describe('emailExists', () => {
    it('should return true for existing email', async () => {
      await userModel.create(
        'test10@example.com',
        'password123',
        'Test User',
        UserRole.USER,
        testInstitutionId
      );

      const exists = await userModel.emailExists('test10@example.com');
      expect(exists).toBe(true);
    });

    it('should return false for non-existent email', async () => {
      const exists = await userModel.emailExists('nonexistent@example.com');
      expect(exists).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete user', async () => {
      const user = await userModel.create(
        'test11@example.com',
        'password123',
        'Test User',
        UserRole.USER,
        testInstitutionId
      );

      const result = await userModel.delete(user.id);
      expect(result).toBe(true);

      const foundUser = await userModel.findById(user.id);
      expect(foundUser).toBeNull();
    });

    it('should return false for non-existent user', async () => {
      const result = await userModel.delete('00000000-0000-0000-0000-000000000999');
      expect(result).toBe(false);
    });
  });
});
