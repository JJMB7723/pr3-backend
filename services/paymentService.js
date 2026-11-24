// services/paymentService.js – Payment Business Logic
// ----------------------------------------------------

const { sequelize, Payment, Order, Notification } = require('../models');

/**
 * Initiate payment for an order
 */
const initiatePayment = async (userId, { order_id, payment_method = 'card' }) => {
  const order = await Order.findByPk(order_id);
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  if (order.user_id !== userId) {
    const error = new Error('Forbidden. You do not own this order.');
    error.statusCode = 403;
    throw error;
  }

  const currentStatus = order.orderStatus || order.order_status;
  if (currentStatus === 'cancelled') {
    const error = new Error('Cannot initiate payment for a cancelled order.');
    error.statusCode = 400;
    throw error;
  }

  const transactionReference = `TXN-${order.id}-${Date.now()}`;
  const amount = order.totalAmount || order.total_amount;

  const payment = await Payment.create({
    orderId: order.id,
    order_id: order.id,
    transactionReference,
    transaction_reference: transactionReference,
    paymentMethod: payment_method,
    payment_method,
    paymentStatus: 'pending',
    payment_status: 'pending',
    amount: parseFloat(amount),
  });

  return {
    payment_id: payment.id,
    transaction_id: transactionReference,
    transaction_reference: transactionReference,
    order_id: order.id,
    amount: payment.amount,
    currency: 'LKR',
    payment_status: 'pending',
  };
};

/**
 * Verify payment completion (Webhook or gateway verification)
 */
const verifyPayment = async ({ transaction_id, status = 'successful' }) => {
  const payment = await Payment.findOne({
    where: {
      transaction_reference: transaction_id,
    },
  });

  if (!payment) {
    const error = new Error('Payment record not found for transaction reference.');
    error.statusCode = 404;
    throw error;
  }

  const existingStatus = payment.paymentStatus || payment.payment_status;
  if (existingStatus === 'successful') {
    return { message: 'Payment was already verified successfully.', payment };
  }

  return await sequelize.transaction(async (t) => {
    payment.paymentStatus = status;
    payment.payment_status = status;
    await payment.save({ transaction: t });

    const order = await Order.findByPk(payment.order_id, { transaction: t });
    if (order) {
      if (status === 'successful') {
        order.orderStatus = 'confirmed';
        order.order_status = 'confirmed';
        await order.save({ transaction: t });

        await Notification.create(
          {
            userId: order.user_id,
            user_id: order.user_id,
            title: 'Payment Received',
            message: `Payment of LKR ${payment.amount} for Order #${order.orderNumber || order.order_number} was successfully verified.`,
            type: 'payment',
            metadata: { order_id: order.id, transaction_id },
          },
          { transaction: t }
        );
      }
    }

    return {
      message: `Payment marked as ${status}.`,
      payment,
      order,
    };
  });
};

/**
 * Get payments for an order
 */
const getPaymentsByOrder = async (orderId, userId, userRole) => {
  const order = await Order.findByPk(orderId);
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  if (userRole === 'customer' && order.user_id !== userId) {
    const error = new Error('Forbidden. You do not own this order.');
    error.statusCode = 403;
    throw error;
  }

  return await Payment.findAll({
    where: { order_id: orderId },
    order: [['created_at', 'DESC']],
  });
};

/**
 * Get single payment by ID
 */
const getPaymentById = async (paymentId, userId, userRole) => {
  const payment = await Payment.findByPk(paymentId, {
    include: [{ model: Order, as: 'order' }],
  });

  if (!payment) {
    const error = new Error('Payment not found');
    error.statusCode = 404;
    throw error;
  }

  if (userRole === 'customer' && payment.order && payment.order.user_id !== userId) {
    const error = new Error('Forbidden. You do not own this payment record.');
    error.statusCode = 403;
    throw error;
  }

  return payment;
};

module.exports = {
  initiatePayment,
  verifyPayment,
  getPaymentsByOrder,
  getPaymentById,
};
