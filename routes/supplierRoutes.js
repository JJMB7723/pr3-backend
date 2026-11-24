// routes/supplierRoutes.js – Supplier & Business Routes
// ------------------------------------------------------

const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

router.use(protect);

// GET /api/suppliers/profile/me – View own profile (Business or Supplier)
router.get('/profile/me', authorizeRoles('business', 'supplier'), supplierController.getProfile);

// PUT /api/suppliers/profile/me – Update own profile (Business or Supplier)
router.put('/profile/me', authorizeRoles('business', 'supplier'), supplierController.updateProfile);

// GET /api/suppliers – List all suppliers (Admin / Business)
router.get('/', authorizeRoles('admin', 'business'), supplierController.getSuppliers);

// GET /api/suppliers/:id – View supplier details (Admin / Business)
router.get('/:id', authorizeRoles('admin', 'business'), supplierController.getSupplier);

module.exports = router;
