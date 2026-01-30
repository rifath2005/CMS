import {
  isValidEmail,
  validateInstitutionalEmail,
  isValidPassword,
  isValidUUID,
  isPositiveNumber,
  isNonNegativeNumber,
  sanitizeString,
  validateRequiredFields,
  isValidPrice,
  isValidQuantity,
} from './validators';
import { ValidationError } from './errors';

describe('Validators', () => {
  describe('isValidEmail', () => {
    it('should validate correct email formats', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test.user@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('invalid@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });
  });

  describe('validateInstitutionalEmail', () => {
    it('should validate emails with correct domain', () => {
      expect(validateInstitutionalEmail('student@university.edu', 'university.edu')).toBe(true);
      expect(validateInstitutionalEmail('staff@college.ac.in', 'college.ac.in')).toBe(true);
    });

    it('should reject emails with incorrect domain', () => {
      expect(validateInstitutionalEmail('user@gmail.com', 'university.edu')).toBe(false);
      expect(validateInstitutionalEmail('user@other.edu', 'university.edu')).toBe(false);
    });

    it('should reject invalid email formats', () => {
      expect(validateInstitutionalEmail('invalid', 'university.edu')).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('should validate strong passwords', () => {
      expect(isValidPassword('Password123')).toBe(true);
      expect(isValidPassword('StrongP@ss1')).toBe(true);
      expect(isValidPassword('MySecure123Pass')).toBe(true);
    });

    it('should reject weak passwords', () => {
      expect(isValidPassword('short')).toBe(false);
      expect(isValidPassword('alllowercase123')).toBe(false);
      expect(isValidPassword('ALLUPPERCASE123')).toBe(false);
      expect(isValidPassword('NoNumbers')).toBe(false);
      expect(isValidPassword('12345678')).toBe(false);
    });
  });

  describe('isValidUUID', () => {
    it('should validate correct UUID formats', () => {
      expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      expect(isValidUUID('00000000-0000-0000-0000-000000000000')).toBe(true);
    });

    it('should reject invalid UUID formats', () => {
      expect(isValidUUID('invalid')).toBe(false);
      expect(isValidUUID('123e4567-e89b-12d3-a456')).toBe(false);
      expect(isValidUUID('123e4567e89b12d3a456426614174000')).toBe(false);
      expect(isValidUUID('')).toBe(false);
    });
  });

  describe('isPositiveNumber', () => {
    it('should validate positive numbers', () => {
      expect(isPositiveNumber(1)).toBe(true);
      expect(isPositiveNumber(100)).toBe(true);
      expect(isPositiveNumber(0.5)).toBe(true);
    });

    it('should reject non-positive numbers', () => {
      expect(isPositiveNumber(0)).toBe(false);
      expect(isPositiveNumber(-1)).toBe(false);
      expect(isPositiveNumber(NaN)).toBe(false);
    });
  });

  describe('isNonNegativeNumber', () => {
    it('should validate non-negative numbers', () => {
      expect(isNonNegativeNumber(0)).toBe(true);
      expect(isNonNegativeNumber(1)).toBe(true);
      expect(isNonNegativeNumber(100.5)).toBe(true);
    });

    it('should reject negative numbers', () => {
      expect(isNonNegativeNumber(-1)).toBe(false);
      expect(isNonNegativeNumber(-0.1)).toBe(false);
      expect(isNonNegativeNumber(NaN)).toBe(false);
    });
  });

  describe('sanitizeString', () => {
    it('should trim whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
      expect(sanitizeString('\n\ttest\n')).toBe('test');
    });

    it('should remove dangerous characters', () => {
      expect(sanitizeString('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
      expect(sanitizeString('Hello <b>World</b>')).toBe('Hello bWorld/b');
    });
  });

  describe('validateRequiredFields', () => {
    it('should pass when all required fields are present', () => {
      const data = { name: 'John', email: 'john@example.com', age: 25 };
      expect(() => validateRequiredFields(data, ['name', 'email'])).not.toThrow();
    });

    it('should throw when required fields are missing', () => {
      const data = { name: 'John' };
      expect(() => validateRequiredFields(data, ['name', 'email'])).toThrow(ValidationError);
      expect(() => validateRequiredFields(data, ['name', 'email'])).toThrow('Missing required fields: email');
    });

    it('should throw when multiple fields are missing', () => {
      const data = {};
      expect(() => validateRequiredFields(data, ['name', 'email', 'age'])).toThrow('Missing required fields: name, email, age');
    });
  });

  describe('isValidPrice', () => {
    it('should validate valid prices', () => {
      expect(isValidPrice(0)).toBe(true);
      expect(isValidPrice(10.99)).toBe(true);
      expect(isValidPrice(100)).toBe(true);
    });

    it('should reject invalid prices', () => {
      expect(isValidPrice(-1)).toBe(false);
      expect(isValidPrice(NaN)).toBe(false);
      expect(isValidPrice(Infinity)).toBe(false);
    });
  });

  describe('isValidQuantity', () => {
    it('should validate valid quantities', () => {
      expect(isValidQuantity(1)).toBe(true);
      expect(isValidQuantity(10)).toBe(true);
      expect(isValidQuantity(100)).toBe(true);
    });

    it('should reject invalid quantities', () => {
      expect(isValidQuantity(0)).toBe(false);
      expect(isValidQuantity(-1)).toBe(false);
      expect(isValidQuantity(1.5)).toBe(false);
      expect(isValidQuantity(NaN)).toBe(false);
    });
  });
});
