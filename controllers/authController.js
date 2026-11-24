// controllers/authController.js – Authentication Controller
// -----------------------------------------------------------
// Handles HTTP request and response handling for authentication routes

const authService = require('../services/authService');

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user account (customer, business, or supplier)
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const {
      firstName,
      first_name,
      lastName,
      last_name,
      email,
      phone,
      password,
      role,
    } = req.body;

    // Call authService with normalized input
    const user = await authService.register({
      firstName: first_name !== undefined ? first_name : firstName,
      lastName: last_name !== undefined ? last_name : lastName,
      email,
      phone,
      password,
      role,
    });

    // Return HTTP 201 with the requested response format
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user credentials and issue a JWT token
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await authService.login({ email, password });

    res.status(200).json({
      message: 'Login successful',
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user profile
 * @access  Private (All authenticated roles)
 */
const getMe = async (req, res, next) => {
  try {
    // req.user was attached by authMiddleware (protect)
    res.status(200).json({
      success: true,
      user: {
        id: req.user.id,
        first_name: req.user.firstName,
        last_name: req.user.lastName,
        email: req.user.email,
        phone: req.user.phone,
        role: req.user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/auth/admin-only
 * @desc    Admin-only protected route (verifies role authorization)
 * @access  Private (Admin only)
 */
const adminOnly = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Access granted. Welcome to admin-only area.',
      user: {
        id: req.user.id,
        role: req.user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  adminOnly,
};
