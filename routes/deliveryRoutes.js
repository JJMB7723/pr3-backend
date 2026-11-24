// routes/deliveryRoutes.js – Delivery Routes
// ------------------------------------------

const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

router.use(protect);

// GET /api/deliveries – View deliveries (scoped for delivery staff, all for admin)
router.get('/', authorizeRoles('admin', 'delivery'), deliveryController.getDeliveries);

// POST /api/deliveries – Dispatch order and assign delivery staff (Admin only)
router.post('/', authorizeRoles('admin'), deliveryController.createDelivery);

// PUT /api/deliveries/:id/status – Update delivery status (Admin or assigned delivery staff)
router.put('/:id/status', authorizeRoles('admin', 'delivery'), deliveryController.updateStatus);

module.exports = router;
