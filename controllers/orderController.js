// controllers/orderController.js – Order Controller
// ---------------------------------------------------

const orderService = require('../services/orderService');
const pricingService = require('../services/pricingService');
const { Cart, CartItem, ProductVariant } = require('../models');

const validateCoupon = async (req, res, next) => {
  try {
    const { coupon_code, subtotal: clientSubtotal } = req.body;
    let subtotal = parseFloat(clientSubtotal);

    // Compute subtotal directly from user's active cart for accuracy
    const cart = await Cart.findOne({
      where: { user_id: req.user.id, status: 'active' },
      include: [
        {
          model: CartItem,
          as: 'items',
          include: [{ model: ProductVariant, as: 'product_variant' }],
        },
      ],
    });

    if (cart && cart.items && cart.items.length > 0) {
      subtotal = cart.items.reduce((sum, item) => {
        const price = parseFloat(item.product_variant?.price || 0);
        return sum + price * item.quantity;
      }, 0);
    } else if (isNaN(subtotal)) {
      subtotal = 0;
    }

    const result = await pricingService.validateCoupon(coupon_code, subtotal);

    res.status(200).json({
      success: true,
      message: `Coupon '${result.code}' applied! You save $${result.discountAmount.toFixed(2)}.`,
      data: {
        code: result.code,
        description: result.description,
        discount_type: result.discountType,
        discount_value: result.discountValue,
        subtotal: result.subtotal,
        discount_amount: result.discountAmount,
        final_total: result.finalTotal,
      },
    });
  } catch (error) {
    next(error);
  }
};

const createOrder = async (req, res, next) => {
  try {
    const order = await orderService.createOrderFromCart(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

const getOrders = async (req, res, next) => {
  try {
    const orders = await orderService.getOrders(req.user.id, req.user.role);
    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

const getOrder = async (req, res, next) => {
  try {
    const order = await orderService.getOrderById(req.params.id, req.user.id, req.user.role);
    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

const updateStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required.' });
    }
    const order = await orderService.updateOrderStatus(req.params.id, status);
    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const result = await orderService.cancelOrder(req.params.id, req.user.id, req.user.role);
    res.status(200).json({
      success: true,
      message: result.message,
      data: result.order,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  validateCoupon,
  createOrder,
  getOrders,
  getOrder,
  updateStatus,
  cancelOrder,
};
