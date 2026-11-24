// routes/paymentRoutes.js – Payment Routes
// ------------------------------------------

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middlewares/authMiddleware');

// Protected payment routes
router.use(protect);

// POST /api/payments/initiate – Initiate payment session
router.post('/initiate', paymentController.initiate);

// POST /api/payments/verify – Verify gateway payment completion
router.post('/verify', paymentController.verify);

// GET /api/payments/order/:orderId – Get payments for order
router.get('/order/:orderId', paymentController.getOrderPayments);

// GET /api/payments/:id – Get single payment
router.get('/:id', paymentController.getPayment);

module.exports = router;
