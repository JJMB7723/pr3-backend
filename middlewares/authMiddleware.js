// middlewares/authMiddleware.js – JWT Authentication Middleware
// -------------------------------------------------------------
// Verifies Bearer tokens, protects private endpoints, and attaches
// the authenticated user object to req.user.

const jwt = require('jsonwebtoken');
const { User } = require('../models');

const protect = async (req, res, next) => {
  try {
    let token;

    // 1. Check for Authorization header starting with "Bearer"
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // 2. Reject if no token is provided
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided.',
      });
    }

    // 3. Verify the token using JWT_SECRET
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired. Please log in again.',
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Authentication failed.',
      });
    }

    // 4. Retrieve user from database using decoded.id or decoded.sub
    const userId = decoded.id || decoded.sub;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User belonging to this token no longer exists.',
      });
    }

    // 5. Ensure the account is not deactivated
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account is deactivated. Please contact support.',
      });
    }

    // 6. Attach sanitized user info to req.user (no password or password_hash)
    req.user = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
    };

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  protect,
  authMiddleware: protect,
};
