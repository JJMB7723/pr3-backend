// services/authService.js – User Authentication Business Logic
// -------------------------------------------------------------
// Handles:
// - Email duplicate verification in PostgreSQL
// - Bcrypt password hashing (12 salt rounds)
// - User creation via Sequelize User model
// - User login authentication & bcrypt.compare()
// - JWT token generation

const bcrypt = require('bcrypt');
const { User } = require('../models');
const { validateRegistration, validateLogin } = require('../validations/authValidation');
const generateToken = require('../utils/generateToken');

/**
 * Register a new user account
 * @param {Object} userData - { firstName, lastName, email, phone, password, role }
 * @returns {Object} Sanitized user data
 */
const register = async (userData) => {
  // 1. Validate inputs defensively
  const { isValid, errors, normalizedData } = validateRegistration(userData);
  if (!isValid) {
    const error = new Error(errors[0]);
    error.statusCode = 400;
    error.errors = errors;
    throw error;
  }

  const { firstName, lastName, email, phone, password, role } = normalizedData;

  // 2. Check for duplicate email in PostgreSQL
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    const error = new Error('An account with this email address already exists.');
    error.statusCode = 409; // HTTP 409 Conflict
    throw error;
  }

  // 3. Hash password with bcrypt using 12 salt rounds
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // 4. Create user in PostgreSQL database using Sequelize
  const newUser = await User.create({
    firstName,
    lastName,
    email,
    phone,
    passwordHash,
    role, // 'customer', 'business', or 'supplier'
    isActive: true,
  });

  // 5. Return sanitized user data (never return password or password_hash)
  return {
    id: newUser.id,
    first_name: newUser.firstName,
    last_name: newUser.lastName,
    email: newUser.email,
    phone: newUser.phone,
    role: newUser.role,
  };
};

/**
 * Authenticate user credentials and issue a JWT token
 * @param {Object} credentials - { email, password }
 * @returns {Object} { token, user }
 */
const login = async ({ email, password }) => {
  // 1. Defensively validate login input
  const { isValid, errors, normalizedData } = validateLogin({ email, password });
  if (!isValid) {
    const error = new Error(errors[0]);
    error.statusCode = 400;
    error.errors = errors;
    throw error;
  }

  const normalizedEmail = normalizedData.email;

  // 2. Find user by email in PostgreSQL
  const user = await User.findOne({ where: { email: normalizedEmail } });
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401; // Unauthorized
    throw error;
  }

  // 3. Check if user account is active
  if (!user.isActive) {
    const error = new Error('Your account is deactivated. Please contact support.');
    error.statusCode = 401; // Reject login for deactivated accounts
    throw error;
  }

  // 4. Verify password using bcrypt.compare()
  const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401; // Generic message: do not reveal whether email or password was wrong
    throw error;
  }

  // 5. Generate signed JWT token
  const token = generateToken({
    sub: user.id,
    id: user.id,
    role: user.role,
  });

  // 6. Return sanitized user object & token (never return password or password_hash)
  return {
    token,
    user: {
      id: user.id,
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.email,
      role: user.role,
    },
  };
};

module.exports = {
  register,
  login,
};
