// middlewares/roleMiddleware.js – Role-Based Authorization
// --------------------------------------------------------
// Restricts route access to specified user roles (e.g., 'admin', 'delivery', 'customer').
// Requires authMiddleware (protect) to run first so req.user exists.

/**
 * Restricts access to users having one of the specified allowed roles
 * @param  {...string} allowedRoles - e.g. 'admin', 'delivery', 'customer'
 * @returns {Function} Express middleware function
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // 1. Verify that user was authenticated by authMiddleware
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before checking permissions.',
      });
    }

    // 2. Check if the user's role is allowed
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden. You do not have permission to access this resource. Required role(s): ${allowedRoles.join(', ')}.`,
      });
    }

    // 3. User has permitted role -> proceed
    next();
  };
};

module.exports = { authorizeRoles };

