// services/orderService.js – Order Management Business Logic
// -----------------------------------------------------------

const {
  sequelize,
  Order,
  User,
  OrderItem,
  Cart,
  CartItem,
  ProductVariant,
  Product,
  Inventory,
  Payment,
  Delivery,
  StockMovement,
  Notification,
} = require('../models');
const generateOrderNumber = require('../utils/generateOrderNumber');

const VALID_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

/**
 * Create order from user's active cart using a database transaction
 */
const createOrderFromCart = async (userId, shippingDetails = {}) => {
  const cart = await Cart.findOne({
    where: { user_id: userId, status: 'active' },
    include: [
      {
        model: CartItem,
        as: 'items',
        include: [
          {
            model: ProductVariant,
            as: 'product_variant',
            include: [{ model: Inventory, as: 'inventory' }],
          },
        ],
      },
    ],
  });

  if (!cart || !cart.items || cart.items.length === 0) {
    const error = new Error('Your cart is empty. Add items before placing an order.');
    error.statusCode = 400;
    throw error;
  }

  // Execute checkout inside a managed PostgreSQL Transaction
  const createdOrderId = await sequelize.transaction(async (t) => {
    let subtotal = 0;

    // 1. Verify stock availability for all items
    for (const item of cart.items) {
      const variant = item.product_variant;
      if (!variant) {
        const error = new Error('One or more products in your cart are no longer available.');
        error.statusCode = 400;
        throw error;
      }

      const available = variant.inventory ? variant.inventory.quantity : 0;
      if (item.quantity > available) {
        const error = new Error(
          `Insufficient stock for variant SKU '${variant.sku}'. Available: ${available}, requested: ${item.quantity}.`
        );
        error.statusCode = 400;
        throw error;
      }

      subtotal += parseFloat(variant.price) * item.quantity;
    }

    const totalAmount = subtotal;
    const count = await Order.count({ transaction: t });
    const orderNumber = `PR3-ORD-${1001 + count}`;

    // 2. Create Order record matching models/Order.js
    const order = await Order.create(
      {
        userId,
        user_id: userId,
        orderNumber,
        order_number: orderNumber,
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        total_amount: parseFloat(totalAmount.toFixed(2)),
        orderStatus: 'pending',
        order_status: 'pending',
        shippingName: shippingDetails.shipping_name || 'Valued Customer',
        shipping_name: shippingDetails.shipping_name || 'Valued Customer',
        shippingPhone: shippingDetails.shipping_phone || '0771234567',
        shipping_phone: shippingDetails.shipping_phone || '0771234567',
        shippingAddress: shippingDetails.shipping_address || '123 PR3 Fashion Boulevard',
        shipping_address: shippingDetails.shipping_address || '123 PR3 Fashion Boulevard',
        shippingCity: shippingDetails.shipping_city || 'Colombo',
        shipping_city: shippingDetails.shipping_city || 'Colombo',
        shippingState: shippingDetails.shipping_state || 'Western',
        shipping_state: shippingDetails.shipping_state || 'Western',
        shippingPostalCode: shippingDetails.shipping_postal_code || '00100',
        shipping_postal_code: shippingDetails.shipping_postal_code || '00100',
      },
      { transaction: t }
    );

    // 3. Create OrderItems, decrement stock & log StockMovement
    for (const item of cart.items) {
      const variant = item.product_variant;
      const unitPrice = parseFloat(variant.price);
      const itemTotal = unitPrice * item.quantity;

      await OrderItem.create(
        {
          orderId: order.id,
          order_id: order.id,
          productVariantId: variant.id,
          product_variant_id: variant.id,
          quantity: item.quantity,
          unitPrice,
          unit_price: unitPrice,
          subtotal: parseFloat(itemTotal.toFixed(2)),
        },
        { transaction: t }
      );

      // Decrement inventory stock
      const newStock = variant.inventory.quantity - item.quantity;
      await variant.inventory.update({ quantity: newStock }, { transaction: t });

      // Audit trail in stock_movements
      await StockMovement.create(
        {
          productVariantId: variant.id,
          product_variant_id: variant.id,
          userId,
          user_id: userId,
          type: 'sale',
          quantity: -item.quantity,
          balanceAfter: newStock,
          balance_after: newStock,
          referenceType: 'order',
          reference_type: 'order',
          referenceId: order.id,
          reference_id: order.id,
          reason: `Customer Order #${orderNumber}`,
        },
        { transaction: t }
      );
    }

    // 4. Create initial pending payment record
    await Payment.create(
      {
        orderId: order.id,
        order_id: order.id,
        paymentMethod: shippingDetails.payment_method || 'card',
        payment_method: shippingDetails.payment_method || 'card',
        paymentStatus: 'pending',
        payment_status: 'pending',
        amount: parseFloat(totalAmount.toFixed(2)),
        transactionReference: `TXN-${order.id}-${Date.now()}`,
        transaction_reference: `TXN-${order.id}-${Date.now()}`,
      },
      { transaction: t }
    );

    // 5. Empty user's cart items
    await CartItem.destroy({
      where: { cart_id: cart.id },
      transaction: t,
    });

    // 6. Auto-generate delivery record for fulfillment tracking
    const trackingNumber = `TRK-${order.id}-${Math.floor(1000 + Math.random() * 9000)}`;
    await Delivery.create(
      {
        orderId: order.id,
        order_id: order.id,
        trackingNumber,
        tracking_number: trackingNumber,
        deliveryStatus: 'assigned',
        delivery_status: 'assigned',
        assignedAt: new Date(),
        assigned_at: new Date(),
      },
      { transaction: t }
    );

    // 7. Notify user
    await Notification.create(
      {
        userId,
        user_id: userId,
        title: 'Order Placed Successfully',
        message: `Your order #${orderNumber} has been received and is being processed.`,
        type: 'order',
        metadata: { order_id: order.id, order_number: orderNumber },
      },
      { transaction: t }
    );

    return order.id;
  });

  return await getOrderById(createdOrderId, userId, 'admin');
};

/**
 * Get orders with role-based scoping
 */
const getOrders = async (userId, userRole) => {
  const where = {};
  // Scope orders to the requesting user for all non-admin roles
  if (userRole === 'customer' || userRole === 'business' || userRole === 'delivery') {
    where.user_id = userId;
  }
  // admin sees ALL orders (no filter applied)

  return await Order.findAll({
    where,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'role'],
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
      { model: Payment, as: 'payments' },
      { model: Delivery, as: 'delivery' },
    ],
    order: [['created_at', 'DESC']],
  });
};

/**
 * Get single order by ID with ownership check
 */
const getOrderById = async (orderId, requestingUserId, userRole) => {
  const order = await Order.findByPk(orderId, {
    include: [
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
      { model: Payment, as: 'payments' },
      { model: Delivery, as: 'delivery' },
    ],
  });

  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  if ((userRole === 'customer' || userRole === 'business') && order.user_id !== requestingUserId) {
    const error = new Error('Forbidden. You do not have permission to view this order.');
    error.statusCode = 403;
    throw error;
  }

  return order;
};

/**
 * Update order status (Admin / Authorized staff)
 */
const updateOrderStatus = async (orderId, newStatus) => {
  if (!VALID_STATUSES.includes(newStatus)) {
    const error = new Error(`Invalid status. Permitted values: ${VALID_STATUSES.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const order = await Order.findByPk(orderId);
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  order.orderStatus = newStatus;
  order.order_status = newStatus;
  await order.save();

  // Bi-directional synchronization: Sync Delivery status with Order status
  const orderToDeliveryStatusMap = {
    pending: 'assigned',
    confirmed: 'assigned',
    processing: 'picked_up',
    shipped: 'in_transit',
    delivered: 'delivered',
    cancelled: 'failed',
  };
  const targetDeliveryStatus = orderToDeliveryStatusMap[newStatus] || 'assigned';

  let delivery = await Delivery.findOne({ where: { order_id: order.id } });
  if (delivery) {
    delivery.deliveryStatus = targetDeliveryStatus;
    delivery.delivery_status = targetDeliveryStatus;
    if (targetDeliveryStatus === 'delivered' && !delivery.deliveredAt) {
      delivery.deliveredAt = new Date();
      delivery.delivered_at = new Date();
    }
    await delivery.save();
  } else {
    const trackingNumber = `TRK-${order.id}-${Math.floor(1000 + Math.random() * 9000)}`;
    await Delivery.create({
      orderId: order.id,
      order_id: order.id,
      trackingNumber,
      tracking_number: trackingNumber,
      deliveryStatus: targetDeliveryStatus,
      delivery_status: targetDeliveryStatus,
      assignedAt: new Date(),
      assigned_at: new Date(),
      deliveredAt: targetDeliveryStatus === 'delivered' ? new Date() : null,
      delivered_at: targetDeliveryStatus === 'delivered' ? new Date() : null,
    });
  }

  // Create notification for user
  await Notification.create({
    userId: order.user_id,
    user_id: order.user_id,
    title: `Order Status Updated: ${newStatus.toUpperCase()}`,
    message: `Your order #${order.orderNumber || order.order_number} status is now: ${newStatus}.`,
    type: 'order',
    metadata: { order_id: order.id, status: newStatus },
  });

  return order;
};

/**
 * Cancel order & restore inventory stock in a transaction
 */
const cancelOrder = async (orderId, requestingUserId, userRole) => {
  const order = await Order.findByPk(orderId, {
    include: [
      {
        model: OrderItem,
        as: 'order_items',
        include: [{ model: ProductVariant, as: 'product_variant' }],
      },
    ],
  });

  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  if ((userRole === 'customer' || userRole === 'business') && order.user_id !== requestingUserId) {
    const error = new Error('Forbidden. You cannot cancel an order belonging to another user.');
    error.statusCode = 403;
    throw error;
  }

  const currentStatus = order.orderStatus || order.order_status;
  if (['shipped', 'delivered', 'cancelled'].includes(currentStatus)) {
    const error = new Error(`Order cannot be cancelled because its current status is '${currentStatus}'.`);
    error.statusCode = 400;
    throw error;
  }

  return await sequelize.transaction(async (t) => {
    order.orderStatus = 'cancelled';
    order.order_status = 'cancelled';
    await order.save({ transaction: t });

    for (const item of order.order_items) {
      const inventory = await Inventory.findOne({
        where: { product_variant_id: item.product_variant_id },
        transaction: t,
      });

      if (inventory) {
        const restored = inventory.quantity + item.quantity;
        await inventory.update({ quantity: restored }, { transaction: t });

        await StockMovement.create(
          {
            productVariantId: item.product_variant_id,
            product_variant_id: item.product_variant_id,
            userId: requestingUserId,
            user_id: requestingUserId,
            type: 'adjustment',
            quantity: item.quantity,
            balanceAfter: restored,
            balance_after: restored,
            referenceType: 'order_cancellation',
            reference_type: 'order_cancellation',
            referenceId: order.id,
            reference_id: order.id,
            reason: `Order #${order.orderNumber || order.order_number} cancelled`,
          },
          { transaction: t }
        );
      }
    }

    await Notification.create(
      {
        userId: order.user_id,
        user_id: order.user_id,
        title: 'Order Cancelled',
        message: `Your order #${order.orderNumber || order.order_number} has been cancelled and items have been restored.`,
        type: 'order',
        metadata: { order_id: order.id },
      },
      { transaction: t }
    );

    return {
      message: 'Order cancelled successfully. Stock has been restored.',
      order,
    };
  });
};

module.exports = {
  createOrderFromCart,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
};
