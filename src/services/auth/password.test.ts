import { hashPassword, comparePassword, validatePasswordStrength } from './password';

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'testPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it('should throw error for empty password', async () => {
      await expect(hashPassword('')).rejects.toThrow('Password cannot be empty');
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password and hash', async () => {
      const password = 'testPassword123';
      const hash = await hashPassword(password);
      const result = await comparePassword(password, hash);

      expect(result).toBe(true);
    });

    it('should return false for non-matching password and hash', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword456';
      const hash = await hashPassword(password);
      const result = await comparePassword(wrongPassword, hash);

      expect(result).toBe(false);
    });

    it('should return false for empty password', async () => {
      const hash = await hashPassword('testPassword123');
      const result = await comparePassword('', hash);

      expect(result).toBe(false);
    });

    it('should return false for empty hash', async () => {
      const result = await comparePassword('testPassword123', '');

      expect(result).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should return true for valid password', () => {
      expect(validatePasswordStrength('password123')).toBe(true);
      expect(validatePasswordStrength('Test1234')).toBe(true);
      expect(validatePasswordStrength('MyP@ssw0rd')).toBe(true);
    });

    it('should return false for password shorter than 8 characters', () => {
      expect(validatePasswordStrength('pass1')).toBe(false);
      expect(validatePasswordStrength('Test1')).toBe(false);
    });

    it('should return false for password without letters', () => {
      expect(validatePasswordStrength('12345678')).toBe(false);
    });

    it('should return false for password without numbers', () => {
      expect(validatePasswordStrength('password')).toBe(false);
      expect(validatePasswordStrength('TestPassword')).toBe(false);
    });

    it('should return false for empty password', () => {
      expect(validatePasswordStrength('')).toBe(false);
    });
  });
});
