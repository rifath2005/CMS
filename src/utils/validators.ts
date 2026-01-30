import { ValidationError } from './errors';

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate institutional email domain
 */
export const validateInstitutionalEmail = (email: string, allowedDomain: string): boolean => {
  if (!isValidEmail(email)) {
    return false;
  }
  
  const domain = email.split('@')[1];
  return domain === allowedDomain;
};

/**
 * Validate password strength
 */
export const isValidPassword = (password: string): boolean => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Validate UUID format
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Validate positive number
 */
export const isPositiveNumber = (value: number): boolean => {
  return typeof value === 'number' && value > 0 && !isNaN(value);
};

/**
 * Validate non-negative number
 */
export const isNonNegativeNumber = (value: number): boolean => {
  return typeof value === 'number' && value >= 0 && !isNaN(value);
};

/**
 * Sanitize string input
 */
export const sanitizeString = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

/**
 * Validate required fields
 */
export const validateRequiredFields = (data: any, requiredFields: string[]): void => {
  const missingFields = requiredFields.filter(field => !data[field]);
  
  if (missingFields.length > 0) {
    throw new ValidationError(`Missing required fields: ${missingFields.join(', ')}`);
  }
};

/**
 * Validate price format
 */
export const isValidPrice = (price: number): boolean => {
  return isNonNegativeNumber(price) && Number.isFinite(price);
};

/**
 * Validate quantity
 */
export const isValidQuantity = (quantity: number): boolean => {
  return Number.isInteger(quantity) && quantity > 0;
};
