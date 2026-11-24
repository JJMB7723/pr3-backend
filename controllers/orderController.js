// controllers/orderController.js – Order Controller
// ---------------------------------------------------

const orderService = require('../services/orderService');

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
  createOrder,
  getOrders,
  getOrder,
  updateStatus,
  cancelOrder,
};
