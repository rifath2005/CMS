import bcrypt from 'bcrypt';

/**
 * Password hashing utilities using bcrypt
 * Validates: Requirements 13.1 (Password Encryption)
 */

const SALT_ROUNDS = 10;

/**
 * Hash a plain text password using bcrypt
 * @param password - Plain text password to hash
 * @returns Promise resolving to the hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || password.length === 0) {
    throw new Error('Password cannot be empty');
  }
  
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain text password with a hashed password
 * @param password - Plain text password to verify
 * @param hash - Hashed password to compare against
 * @returns Promise resolving to true if passwords match, false otherwise
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) {
    return false;
  }
  
  return bcrypt.compare(password, hash);
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns true if password meets requirements, false otherwise
 */
export function validatePasswordStrength(password: string): boolean {
  // Minimum 8 characters, at least one letter and one number
  const minLength = 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  return password.length >= minLength && hasLetter && hasNumber;
}
