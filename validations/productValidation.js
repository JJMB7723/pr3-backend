// validations/productValidation.js – Catalog Validation
// -----------------------------------------------------

const validateCategoryInput = (req, res, next) => {
  const { name } = req.body;
  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Category name is required.',
    });
  }
  next();
};

const validateProductInput = (req, res, next) => {
  const { name, category_id } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim() === '') {
    errors.push('Product name is required.');
  }

  if (!category_id) {
    errors.push('Category ID is required.');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors[0],
      errors,
    });
  }

  next();
};

module.exports = {
  validateCategoryInput,
  validateProductInput,
};

