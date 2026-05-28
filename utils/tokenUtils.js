import crypto from 'crypto';

/**
 * Generate a random verification token
 * @returns {string} Random token
 */
export const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash a verification token
 * @param {string} token - The token to hash
 * @returns {string} Hashed token
 */
export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};
 
/**
 * Generate token expiry time
 * @param {number} expiryMs - Expiry time in milliseconds (default: 15 minutes)
 * @returns {Date} Expiry date
 */
export const generateTokenExpiry = (expiryMs = 15 * 60 * 1000) => {
  return new Date(Date.now() + expiryMs);
};

/**
 * Check if token has expired
 * @param {Date} expiryDate - The expiry date
 * @returns {boolean} True if expired
 */
export const isTokenExpired = (expiryDate) => {
  return expiryDate < new Date();
};
