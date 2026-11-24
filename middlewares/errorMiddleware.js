// middlewares/errorMiddleware.js – Centralized error handling
// -----------------------------------------------------------
// 1. notFoundHandler – handles unknown or invalid API endpoints (404)
// 2. errorHandler    – handles unexpected application, validation, and database errors

// 404 Handler: Triggers when no preceding route matches the requested URL
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

// Centralized Error Handler: Catches errors thrown by routes/controllers
const errorHandler = (err, req, res, next) => {
  console.error('Server Error:', err.message);

  let statusCode = err.statusCode || 500;
  let message = 'Internal server error';

  // Specific handling for Sequelize errors
  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    message = 'A record with this unique value already exists.';
  } else if (err.name === 'SequelizeValidationError') {
    statusCode = 400;
    message = err.errors ? err.errors.map((e) => e.message).join(', ') : 'Validation failed.';
  } else if (err.name && err.name.startsWith('Sequelize')) {
    statusCode = 500;
    message = 'A database error occurred. Please try again later.';
  } else if (statusCode !== 500) {
    // Custom operational error message with non-500 status code (400, 401, 403, 404, etc.)
    message = err.message;
  }

  // Never expose raw stack traces or internal secrets to clients
  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = { notFoundHandler, errorHandler };
