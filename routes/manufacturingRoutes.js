// routes/manufacturingRoutes.js – Manufacturing, Production & QC Routes
// ---------------------------------------------------------------------

const express = require('express');
const router = express.Router();
const manufacturingController = require('../controllers/manufacturingController');
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

router.use(protect);

// GET /api/manufacturing – List work orders (Admin, Business, Supplier)
router.get('/', authorizeRoles('admin', 'business', 'supplier'), manufacturingController.getOrders);

// GET /api/manufacturing/:id – Work order details
router.get('/:id', authorizeRoles('admin', 'business', 'supplier'), manufacturingController.getOrder);

// POST /api/manufacturing – Create work order (Admin only)
router.post('/', authorizeRoles('admin'), manufacturingController.createOrder);

// PUT /api/manufacturing/:id/status – Update work order status (Admin only)
router.put('/:id/status', authorizeRoles('admin'), manufacturingController.updateStatus);

// POST /api/manufacturing/production – Log production stage
router.post('/production', authorizeRoles('admin', 'business', 'supplier'), manufacturingController.logProduction);

// POST /api/manufacturing/inspection – Record QC inspection & credit inventory
router.post('/inspection', authorizeRoles('admin'), manufacturingController.recordInspection);

module.exports = router;

