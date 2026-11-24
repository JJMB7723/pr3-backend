// controllers/deliveryController.js – Delivery Controller
// ---------------------------------------------------------

const deliveryService = require('../services/deliveryService');

const createDelivery = async (req, res, next) => {
  try {
    const delivery = await deliveryService.createDelivery(req.body);
    res.status(201).json({
      success: true,
      message: 'Order dispatched for delivery',
      data: delivery,
    });
  } catch (error) {
    next(error);
  }
};

const getDeliveries = async (req, res, next) => {
  try {
    const deliveries = await deliveryService.getDeliveries(req.user.id, req.user.role);
    res.status(200).json({
      success: true,
      count: deliveries.length,
      data: deliveries,
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

    const delivery = await deliveryService.updateDeliveryStatus(
      req.params.id,
      req.user.id,
      req.user.role,
      status
    );

    res.status(200).json({
      success: true,
      message: `Delivery status updated to ${status}`,
      data: delivery,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDelivery,
  getDeliveries,
  updateStatus,
};
