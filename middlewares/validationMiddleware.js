// middlewares/validationMiddleware.js – Request Validation Middleware
// -------------------------------------------------------------------
// Generic wrapper allowing custom validation functions to be run as Express middleware.

/**
 * Creates an Express middleware from any validation function
 * @param {Function} validatorFn - Function accepting data and returning { isValid, errors, normalizedData }
 * @returns {Function} Express middleware
 */
const validate = (validatorFn) => {
  return (req, res, next) => {
    const { isValid, errors, normalizedData } = validatorFn(req.body);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: errors[0],
        errors,
      });
    }

    // Merge sanitized and normalized data into req.body
    req.body = { ...req.body, ...normalizedData };
    next();
  };
};

module.exports = { validate };

