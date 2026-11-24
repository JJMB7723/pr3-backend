// routes/inventoryRoutes.js – Inventory Routes
// ----------------------------------------------

const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

// Public variant stock check
router.get('/variant/:variantId', inventoryController.getVariantStock);

// Protected inventory management (Admin, Business, Supplier)
router.use(protect);

// GET /api/inventory – Full stock overview
router.get('/', authorizeRoles('admin', 'business', 'supplier'), inventoryController.getInventoryList);

// GET /api/inventory/low-stock – Low stock alert items
router.get('/low-stock', authorizeRoles('admin', 'business', 'supplier'), inventoryController.getLowStock);

// POST /api/inventory/adjust – Adjust stock level (Admin only)
router.post('/adjust', authorizeRoles('admin'), inventoryController.adjustStock);

// GET /api/inventory/movements/:variantId – Stock movement audit trail
router.get('/movements/:variantId', authorizeRoles('admin', 'business', 'supplier'), inventoryController.getMovements);

module.exports = router;
