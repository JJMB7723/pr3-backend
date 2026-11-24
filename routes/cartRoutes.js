// routes/cartRoutes.js – Shopping Cart Routes
// --------------------------------------------

const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { protect } = require('../middlewares/authMiddleware');

// All cart operations require authentication
router.use(protect);

// GET /api/cart – View user's cart
router.get('/', cartController.getCart);

// POST /api/cart/items – Add variant to cart
router.post('/items', cartController.addItem);

// PUT /api/cart/items/:id – Update item quantity
router.put('/items/:id', cartController.updateItem);

// DELETE /api/cart/items/:id – Remove item
router.delete('/items/:id', cartController.removeItem);

// DELETE /api/cart – Empty user's cart
router.delete('/', cartController.clearCart);

module.exports = router;
