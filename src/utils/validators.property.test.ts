import fc from 'fast-check';
import {
  isValidEmail,
  isPositiveNumber,
  isNonNegativeNumber,
  isValidQuantity,
  sanitizeString,
} from './validators';

/**
 * Property-based tests for validators
 * These tests verify universal properties across many randomly generated inputs
 */

describe('Validators - Property-Based Tests', () => {
  describe('isValidEmail', () => {
    it('should always return boolean', () => {
      fc.assert(
        fc.property(fc.string(), (input) => {
          const result = isValidEmail(input);
          expect(typeof result).toBe('boolean');
        }),
        { numRuns: 100 }
      );
    });

    it('should accept valid email format', () => {
      fc.assert(
        fc.property(fc.emailAddress(), (email) => {
          expect(isValidEmail(email)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('isPositiveNumber', () => {
    it('should return true for all positive numbers', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 1000000 }), (num) => {
          expect(isPositiveNumber(num)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should return false for zero and negative numbers', () => {
      fc.assert(
        fc.property(fc.integer({ max: 0 }), (num) => {
          expect(isPositiveNumber(num)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should return true for positive floats', () => {
      fc.assert(
        fc.property(fc.float({ min: 0.001, max: 1000000, noNaN: true }), (num) => {
          expect(isPositiveNumber(num)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('isNonNegativeNumber', () => {
    it('should return true for all non-negative numbers including zero', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 1000000 }), (num) => {
          expect(isNonNegativeNumber(num)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should return false for negative numbers', () => {
      fc.assert(
        fc.property(fc.integer({ max: -1 }), (num) => {
          expect(isNonNegativeNumber(num)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('isValidQuantity', () => {
    it('should return true for all positive integers', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 1000 }), (quantity) => {
          expect(isValidQuantity(quantity)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should return false for zero and negative integers', () => {
      fc.assert(
        fc.property(fc.integer({ max: 0 }), (quantity) => {
          expect(isValidQuantity(quantity)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should return false for non-integer numbers', () => {
      fc.assert(
        fc.property(
          fc.float({ min: 0.1, max: 100, noInteger: true, noNaN: true }),
          (quantity) => {
            expect(isValidQuantity(quantity)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('sanitizeString', () => {
    it('should always return a string', () => {
      fc.assert(
        fc.property(fc.string(), (input) => {
          const result = sanitizeString(input);
          expect(typeof result).toBe('string');
        }),
        { numRuns: 100 }
      );
    });

    it('should remove leading and trailing whitespace', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1 }),
          fc.string(),
          fc.string(),
          (prefix, content, suffix) => {
            const input = prefix + content + suffix;
            const result = sanitizeString(input);
            expect(result).toBe(result.trim());
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not contain < or > characters', () => {
      fc.assert(
        fc.property(fc.string(), (input) => {
          const result = sanitizeString(input);
          expect(result).not.toContain('<');
          expect(result).not.toContain('>');
        }),
        { numRuns: 100 }
      );
    });

    it('should be idempotent (sanitizing twice gives same result)', () => {
      fc.assert(
        fc.property(fc.string(), (input) => {
          const once = sanitizeString(input);
          const twice = sanitizeString(once);
          expect(once).toBe(twice);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Email validation is consistent', () => {
    it('should give same result for same input', () => {
      fc.assert(
        fc.property(fc.string(), (input) => {
          const result1 = isValidEmail(input);
          const result2 = isValidEmail(input);
          expect(result1).toBe(result2);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property: Number validation relationships', () => {
    it('positive numbers are always non-negative', () => {
      fc.assert(
        fc.property(fc.float({ noNaN: true }), (num) => {
          if (isPositiveNumber(num)) {
            expect(isNonNegativeNumber(num)).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('valid quantities are always positive numbers', () => {
      fc.assert(
        fc.property(fc.integer(), (num) => {
          if (isValidQuantity(num)) {
            expect(isPositiveNumber(num)).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});
