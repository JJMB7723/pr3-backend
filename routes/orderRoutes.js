// routes/orderRoutes.js – Order Routes
// --------------------------------------

const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

// All order operations require authentication
router.use(protect);

// POST /api/orders – Checkout current cart to order (Customer / Business / Admin)
router.post('/', authorizeRoles('customer', 'business', 'admin'), orderController.createOrder);

// GET /api/orders – View orders (scoped to customer, full for admin)
router.get('/', orderController.getOrders);

// GET /api/orders/:id – View single order
router.get('/:id', orderController.getOrder);

// PUT /api/orders/:id/status – Update order status (Admin only)
router.put('/:id/status', authorizeRoles('admin'), orderController.updateStatus);

// POST /api/orders/:id/cancel – Cancel order & restore stock
router.post('/:id/cancel', orderController.cancelOrder);

module.exports = router;
