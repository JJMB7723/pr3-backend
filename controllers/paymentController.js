// controllers/paymentController.js – Payment Controller
// -------------------------------------------------------

const paymentService = require('../services/paymentService');

const initiate = async (req, res, next) => {
  try {
    const result = await paymentService.initiatePayment(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Payment session initiated',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const verify = async (req, res, next) => {
  try {
    const { transaction_id, status } = req.body;
    if (!transaction_id) {
      return res.status(400).json({ success: false, message: 'Transaction ID is required.' });
    }

    const result = await paymentService.verifyPayment({
      transaction_id,
      status: status || 'successful',
      gateway_response: req.body,
    });

    res.status(200).json({
      success: true,
      message: result.message,
      data: result.payment,
    });
  } catch (error) {
    next(error);
  }
};

const getOrderPayments = async (req, res, next) => {
  try {
    const payments = await paymentService.getPaymentsByOrder(
      req.params.orderId,
      req.user.id,
      req.user.role
    );
    res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};

const getPayment = async (req, res, next) => {
  try {
    const payment = await paymentService.getPaymentById(
      req.params.id,
      req.user.id,
      req.user.role
    );
    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  initiate,
  verify,
  getOrderPayments,
  getPayment,
};
