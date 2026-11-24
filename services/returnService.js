// services/returnService.js – Customer Returns & Refunds Business Logic
// ---------------------------------------------------------------------

const {
  sequelize,
  ReturnRequest,
  ReturnItem,
  Order,
  OrderItem,
  ProductVariant,
  Product,
  Inventory,
  StockMovement,
  Notification,
  User,
} = require('../models');

/**
 * Customer submits a return request for order items
 */
const requestReturn = async (userId, { order_id, reason, items = [] }) => {
  const order = await Order.findByPk(order_id, {
    include: [{ model: OrderItem, as: 'order_items' }],
  });

  if (!order) {
    const error = new Error('Order not found.');
    error.statusCode = 404;
    throw error;
  }

  if (order.user_id !== userId) {
    const error = new Error('Forbidden. You do not own this order.');
    error.statusCode = 403;
    throw error;
  }

  const orderStatus = order.orderStatus || order.order_status;
  if (orderStatus !== 'delivered') {
    const error = new Error('Returns can only be requested for delivered orders.');
    error.statusCode = 400;
    throw error;
  }

  if (!Array.isArray(items) || items.length === 0) {
    const error = new Error('Please specify at least one order item to return.');
    error.statusCode = 400;
    throw error;
  }

  return await sequelize.transaction(async (t) => {
    // 1. Create ReturnRequest header
    const returnRequest = await ReturnRequest.create(
      {
        orderId: order_id,
        order_id,
        userId,
        user_id: userId,
        reason: reason || 'Item return requested',
        returnStatus: 'requested',
        return_status: 'requested',
      },
      { transaction: t }
    );

    // 2. Validate & create line items
    for (const item of items) {
      const orderItem = order.order_items.find((oi) => oi.id === Number(item.order_item_id));
      if (!orderItem) {
        const error = new Error(`Order item ID ${item.order_item_id} does not belong to this order.`);
        error.statusCode = 400;
        throw error;
      }

      const qty = parseInt(item.quantity, 10) || 1;
      if (qty > orderItem.quantity) {
        const error = new Error(`Return quantity (${qty}) exceeds purchased quantity (${orderItem.quantity}).`);
        error.statusCode = 400;
        throw error;
      }

      await ReturnItem.create(
        {
          returnRequestId: returnRequest.id,
          return_request_id: returnRequest.id,
          orderItemId: orderItem.id,
          order_item_id: orderItem.id,
          quantity: qty,
        },
        { transaction: t }
      );
    }

    return returnRequest;
  });
};

/**
 * Get return requests scoped by user role
 */
const getReturnRequests = async (userId, userRole) => {
  const where = {};
  if (userRole === 'customer') {
    where.user_id = userId;
  }

  return await ReturnRequest.findAll({
    where,
    include: [
      {
        model: Order,
        as: 'order',
        attributes: ['id', 'order_number', 'total_amount', 'order_status'],
      },
      {
        model: User,
        as: 'user',
        attributes: ['id', 'first_name', 'last_name', 'email', 'role'],
      },
      {
        model: ReturnItem,
        as: 'return_items',
        include: [
          {
            model: OrderItem,
            as: 'order_item',
            include: [
              {
                model: ProductVariant,
                as: 'product_variant',
                include: [{ model: Product, as: 'product' }],
              },
            ],
          },
        ],
      },
    ],
    order: [['created_at', 'DESC']],
  });
};

/**
 * Get single return request by ID
 */
const getReturnById = async (returnRequestId, userId, userRole) => {
  const returnReq = await ReturnRequest.findByPk(returnRequestId, {
    include: [
      {
        model: Order,
        as: 'order',
        attributes: ['id', 'order_number', 'total_amount', 'order_status', 'created_at'],
      },
      {
        model: User,
        as: 'user',
        attributes: ['id', 'first_name', 'last_name', 'email', 'role'],
      },
      {
        model: ReturnItem,
        as: 'return_items',
        include: [
          {
            model: OrderItem,
            as: 'order_item',
            include: [
              {
                model: ProductVariant,
                as: 'product_variant',
                include: [{ model: Product, as: 'product' }],
              },
            ],
          },
        ],
      },
    ],
  });

  if (!returnReq) {
    const error = new Error('Return request not found.');
    error.statusCode = 404;
    throw error;
  }

  if (userRole === 'customer' && returnReq.user_id !== userId) {
    const error = new Error('Forbidden. You do not own this return request.');
    error.statusCode = 403;
    throw error;
  }

  return returnReq;
};

/**
 * Admin reviews return request (approve / reject)
 */
const reviewReturnRequest = async (returnRequestId, status, notes = '', resolution = '') => {
  const allowedStatuses = ['approved', 'rejected', 'picked_up', 'completed'];
  if (!allowedStatuses.includes(status)) {
    const error = new Error(`Status must be one of: ${allowedStatuses.join(', ')}`);
    error.statusCode = 400;
    throw error;
  }

  const returnReq = await ReturnRequest.findByPk(returnRequestId, {
    include: [{ model: Order, as: 'order' }],
  });

  if (!returnReq) {
    const error = new Error('Return request not found.');
    error.statusCode = 404;
    throw error;
  }

  returnReq.returnStatus = status;
  returnReq.return_status = status;

  if (resolution || notes) {
    const decisionTag = `\n[Admin Decision: ${status.toUpperCase()}${resolution ? ` (${resolution.toUpperCase()})` : ''}${notes ? ` - ${notes}` : ''}]`;
    returnReq.reason = (returnReq.reason || '') + decisionTag;
  }

  await returnReq.save();

  // Notify customer
  const resolutionNote = resolution ? ` Resolution: ${resolution.toUpperCase()}.` : '';
  const customNotes = notes ? ` Note: ${notes}` : '';
  await Notification.create({
    userId: returnReq.user_id,
    user_id: returnReq.user_id,
    title: `Return Request ${status.toUpperCase()}`,
    message: `Your return request for Order #${returnReq.order ? (returnReq.order.orderNumber || returnReq.order.order_number) : returnReq.order_id} has been ${status}.${resolutionNote}${customNotes}`,
    type: 'order',
    metadata: { return_request_id: returnReq.id, status, resolution, notes },
  });

  return returnReq;
};

/**
 * Inspect physical returned item & restock if in good condition
 */
const inspectAndRestock = async (adminUserId, returnItemId, { is_restockable = true }) => {
  const returnItem = await ReturnItem.findByPk(returnItemId, {
    include: [
      {
        model: OrderItem,
        as: 'order_item',
      },
      {
        model: ReturnRequest,
        as: 'return_request',
      },
    ],
  });

  if (!returnItem) {
    const error = new Error('Return line item not found.');
    error.statusCode = 404;
    throw error;
  }

  return await sequelize.transaction(async (t) => {
    // Mark return request completed
    if (returnItem.return_request) {
      returnItem.return_request.returnStatus = 'completed';
      returnItem.return_request.return_status = 'completed';
      await returnItem.return_request.save({ transaction: t });
    }

    // ONLY restore inventory if item passes inspection
    if (is_restockable && returnItem.order_item) {
      const variantId = returnItem.order_item.product_variant_id;
      let inventory = await Inventory.findOne({
        where: { product_variant_id: variantId },
        transaction: t,
      });

      if (inventory) {
        const restoredStock = inventory.quantity + returnItem.quantity;
        inventory.quantity = restoredStock;
        await inventory.save({ transaction: t });

        // Record stock movement
        await StockMovement.create(
          {
            productVariantId: variantId,
            product_variant_id: variantId,
            userId: adminUserId,
            user_id: adminUserId,
            type: 'return',
            quantity: returnItem.quantity,
            balanceAfter: restoredStock,
            balance_after: restoredStock,
            referenceType: 'return_request',
            reference_type: 'return_request',
            referenceId: returnItem.return_request_id,
            reference_id: returnItem.return_request_id,
            reason: `Restocked via RMA Inspection (RMA Item #${returnItem.id})`,
          },
          { transaction: t }
        );
      }
    }

    return {
      message: is_restockable
        ? 'Item passed inspection and was restored to inventory.'
        : 'Item was inspected as damaged; inventory was NOT increased.',
      return_item: returnItem,
    };
  });
};

module.exports = {
  requestReturn,
  getReturnRequests,
  getReturnById,
  reviewReturnRequest,
  inspectAndRestock,
};
