// services/deliveryService.js – Delivery & Fulfillment Business Logic
// -------------------------------------------------------------------

const {
  sequelize,
  Delivery,
  Order,
  OrderItem,
  ProductVariant,
  Product,
  User,
  Notification,
} = require('../models');

const VALID_DELIVERY_STATUSES = ['assigned', 'picked_up', 'in_transit', 'delivered', 'failed'];

/**
 * Dispatch an order for delivery and assign delivery staff (Admin only)
 */
const createDelivery = async ({ order_id, delivery_staff_id, notes }) => {
  const order = await Order.findByPk(order_id);
  if (!order) {
    const error = new Error('Order not found.');
    error.statusCode = 404;
    throw error;
  }

  const staff = await User.findByPk(delivery_staff_id);
  if (!staff || staff.role !== 'delivery') {
    const error = new Error('Selected user is not registered as delivery staff.');
    error.statusCode = 400;
    throw error;
  }

  const existing = await Delivery.findOne({ where: { order_id } });
  if (existing) {
    const error = new Error('A delivery assignment already exists for this order.');
    error.statusCode = 409;
    throw error;
  }

  const trackingNumber = `TRK-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

  return await sequelize.transaction(async (t) => {
    const delivery = await Delivery.create(
      {
        orderId: order_id,
        order_id,
        deliveryStaffId: delivery_staff_id,
        delivery_staff_id,
        trackingNumber,
        tracking_number: trackingNumber,
        deliveryStatus: 'assigned',
        delivery_status: 'assigned',
        assignedAt: new Date(),
        assigned_at: new Date(),
      },
      { transaction: t }
    );

    // Update order status to shipped
    order.orderStatus = 'shipped';
    order.order_status = 'shipped';
    await order.save({ transaction: t });

    // Notify customer
    await Notification.create(
      {
        userId: order.user_id,
        user_id: order.user_id,
        title: 'Order Dispatched',
        message: `Your order #${order.orderNumber || order.order_number} has been dispatched. Tracking number: ${trackingNumber}.`,
        type: 'delivery',
        metadata: { order_id: order.id, tracking_number: trackingNumber },
      },
      { transaction: t }
    );

    // Notify delivery personnel
    await Notification.create(
      {
        userId: delivery_staff_id,
        user_id: delivery_staff_id,
        title: 'New Delivery Assignment',
        message: `You have been assigned to deliver Order #${order.orderNumber || order.order_number}.`,
        type: 'delivery',
        metadata: { delivery_id: delivery.id, order_id: order.id },
      },
      { transaction: t }
    );

    return delivery;
  });
};

/**
 * Auto-sync any orders that do not yet have a delivery record
 */
const syncMissingDeliveries = async () => {
  try {
    const orders = await Order.findAll({
      include: [{ model: Delivery, as: 'delivery' }],
    });
    const orderToDeliveryStatusMap = {
      pending: 'assigned',
      confirmed: 'assigned',
      processing: 'picked_up',
      shipped: 'in_transit',
      delivered: 'delivered',
      cancelled: 'failed',
    };
    for (const o of orders) {
      if (!o.delivery) {
        const orderStatus = o.orderStatus || o.order_status || 'confirmed';
        const targetStatus = orderToDeliveryStatusMap[orderStatus] || 'assigned';
        const trackingNumber = `TRK-${o.id}-${Math.floor(1000 + Math.random() * 9000)}`;
        await Delivery.create({
          orderId: o.id,
          order_id: o.id,
          trackingNumber,
          tracking_number: trackingNumber,
          deliveryStatus: targetStatus,
          delivery_status: targetStatus,
          assignedAt: new Date(),
          assigned_at: new Date(),
          deliveredAt: targetStatus === 'delivered' ? new Date() : null,
          delivered_at: targetStatus === 'delivered' ? new Date() : null,
        });
      }
    }
  } catch (err) {
    console.error('Error auto-syncing deliveries:', err.message);
  }
};

/**
 * Get deliveries scoped by user role
 */
const getDeliveries = async (userId, userRole) => {
  // Ensure every order has a corresponding delivery
  await syncMissingDeliveries();

  const where = {};
  if (userRole === 'delivery') {
    where.delivery_staff_id = userId;
  }

  return await Delivery.findAll({
    where,
    include: [
      {
        model: Order,
        as: 'order',
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
          },
          {
            model: OrderItem,
            as: 'order_items',
            include: [
              {
                model: ProductVariant,
                as: 'product_variant',
                include: [{ model: Product, as: 'product', attributes: ['id', 'name'] }],
              },
            ],
          },
        ],
      },
      {
        model: User,
        as: 'delivery_staff',
        attributes: ['id', 'firstName', 'lastName', 'phone'],
      },
    ],
    order: [['created_at', 'DESC']],
  });
};

/**
 * Update delivery status
 */
const updateDeliveryStatus = async (deliveryId, userId, userRole, newStatus) => {
  if (!VALID_DELIVERY_STATUSES.includes(newStatus)) {
    const error = new Error(`Invalid status. Permitted values: ${VALID_DELIVERY_STATUSES.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const delivery = await Delivery.findByPk(deliveryId, {
    include: [{ model: Order, as: 'order' }],
  });

  if (!delivery) {
    const error = new Error('Delivery record not found.');
    error.statusCode = 404;
    throw error;
  }

  if (userRole === 'delivery' && delivery.delivery_staff_id !== userId) {
    const error = new Error('Forbidden. You can only update your own assigned deliveries.');
    error.statusCode = 403;
    throw error;
  }

  return await sequelize.transaction(async (t) => {
    delivery.deliveryStatus = newStatus;
    delivery.delivery_status = newStatus;
    if (newStatus === 'delivered') {
      delivery.deliveredAt = new Date();
      delivery.delivered_at = new Date();
    }
    await delivery.save({ transaction: t });

    // Bi-directional synchronization: Update parent order status
    if (delivery.order) {
      const deliveryToOrderStatusMap = {
        assigned: 'confirmed',
        picked_up: 'processing',
        in_transit: 'shipped',
        delivered: 'delivered',
        failed: 'cancelled',
      };
      const targetOrderStatus = deliveryToOrderStatusMap[newStatus];
      if (targetOrderStatus) {
        delivery.order.orderStatus = targetOrderStatus;
        delivery.order.order_status = targetOrderStatus;
        await delivery.order.save({ transaction: t });
      }

      await Notification.create(
        {
          userId: delivery.order.user_id,
          user_id: delivery.order.user_id,
          title: `Delivery Update: ${newStatus.toUpperCase()}`,
          message: `Delivery status for Order #${delivery.order.orderNumber || delivery.order.order_number} is now: ${newStatus}.`,
          type: 'delivery',
          metadata: { delivery_id: delivery.id, order_id: delivery.order.id, status: newStatus },
        },
        { transaction: t }
      );
    }

    return delivery;
  });
};

module.exports = {
  createDelivery,
  getDeliveries,
  updateDeliveryStatus,
};
