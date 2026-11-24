// routes/productRoutes.js – Product and Category Routes
// ------------------------------------------------------

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');
const { validateCategoryInput, validateProductInput } = require('../validations/productValidation');

// ==========================================
// Category Routes
// ==========================================
// GET /api/products/categories – List categories (Public)
router.get('/categories', productController.getCategories);

// GET /api/products/categories/:id – Category details (Public)
router.get('/categories/:id', productController.getCategory);

// POST /api/products/categories – Create category (Admin only)
router.post('/categories', protect, authorizeRoles('admin'), validateCategoryInput, productController.createCategory);

// PUT /api/products/categories/:id – Update category (Admin only)
router.put('/categories/:id', protect, authorizeRoles('admin'), productController.updateCategory);

// DELETE /api/products/categories/:id – Delete category (Admin only)
router.delete('/categories/:id', protect, authorizeRoles('admin'), productController.deleteCategory);

// ==========================================
// Product Routes
// ==========================================
// GET /api/products – List/search/filter products with pagination (Public)
router.get('/', productController.getProducts);

// GET /api/products/:id – Product details (Public)
router.get('/:id', productController.getProduct);

// POST /api/products – Create product (Admin / Business)
router.post('/', protect, authorizeRoles('admin', 'business'), validateProductInput, productController.createProduct);

// PUT /api/products/:id – Update product (Admin / Business)
router.put('/:id', protect, authorizeRoles('admin', 'business'), productController.updateProduct);

// DELETE /api/products/:id – Delete/deactivate product (Admin only)
router.delete('/:id', protect, authorizeRoles('admin'), productController.deleteProduct);

module.exports = router;
