// utils/generateToken.js – JWT Token Generator
// ----------------------------------------------
// Creates a signed JSON Web Token containing the user's ID and role

const jwt = require('jsonwebtoken');

/**
 * Generates a signed JWT token
 * @param {Object} payload - Data to embed in the token (e.g., { sub, id, role })
 * @returns {string} - Signed JWT token
 */
const generateToken = (payload) => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '1d';

  if (!secret) {
    throw new Error('JWT_SECRET is not configured in environment variables');
  }

  return jwt.sign(payload, secret, { expiresIn });
};

module.exports = generateToken;
