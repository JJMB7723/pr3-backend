// services/dashboardService.js – Aggregated Analytics & Reports
// -------------------------------------------------------------

const { Op } = require('sequelize');
const {
  sequelize,
  User,
  Product,
  ProductVariant,
  Order,
  OrderItem,
  Inventory,
  ManufacturingOrder,
  Delivery,
  ReturnRequest,
  Notification,
  BusinessProfile,
  SupplierProfile,
} = require('../models');

const getDashboardStats = async (userId, userRole) => {
  // 1. ADMIN DASHBOARD
  if (userRole === 'admin') {
    const [
      totalUsers,
      totalBusinesses,
      totalProducts,
      totalOrders,
      lowStockCount,
      activeManufacturing,
      pendingDeliveries,
      totalStockUnits,
    ] = await Promise.all([
      User.count(),
      User.count({ where: { role: 'business' } }),
      Product.count({ where: { is_active: true } }),
      Order.count(),
      Inventory.count({ where: { quantity: { [Op.lte]: 50 } } }),
      ManufacturingOrder.count({ where: { status: { [Op.in]: ['pending', 'in_progress', 'working', 'cutting', 'sewing'] } } }),
      Delivery.count({ where: { deliveryStatus: { [Op.in]: ['assigned', 'picked_up', 'in_transit'] } } }),
      Inventory.sum('quantity'),
    ]);

    // Total revenue from all non-cancelled orders
    const revenueOrders = await Order.findAll({
      where: { orderStatus: { [Op.ne]: 'cancelled' } },
      attributes: ['totalAmount', 'orderStatus'],
    });
    const totalRevenue = revenueOrders.reduce(
      (sum, ord) => sum + parseFloat(ord.totalAmount || 0),
      0
    );

    // Recent 5 orders with items & customer identity
    const recentOrders = await Order.findAll({
      limit: 5,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
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
    });

    // Recent deliveries
    const recentDeliveries = await Delivery.findAll({
      limit: 4,
      order: [['created_at', 'DESC']],
      include: [
        {
          model: Order,
          as: 'order',
          attributes: ['id', 'order_number', 'orderNumber', 'shipping_name', 'shipping_city', 'total_amount'],
        },
      ],
    });

    const metrics = {
      totalUsers,
      totalBusinesses,
      totalProducts,
      totalOrders,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      lowStockCount,
      activeManufacturing,
      pendingDeliveries,
      totalStockUnits: totalStockUnits || 0,

      // snake_case aliases
      total_users: totalUsers,
      total_businesses: totalBusinesses,
      total_products: totalProducts,
      total_orders: totalOrders,
      total_revenue_lkr: parseFloat(totalRevenue.toFixed(2)),
      low_stock_items: lowStockCount,
      active_manufacturing_orders: activeManufacturing,
      pending_deliveries: pendingDeliveries,
      total_stock_units: totalStockUnits || 0,
    };

    return {
      scope: 'admin',
      metrics,
      recentOrders,
      recentDeliveries,
    };
  }

  // 2. BUSINESS DASHBOARD
  if (userRole === 'business') {
    const profile = await BusinessProfile.findOne({ where: { user_id: userId } });
    const orders = await Order.findAll({
      where: { user_id: userId },
      attributes: ['id', 'totalAmount', 'orderStatus'],
    });

    const totalSpent = orders.reduce((sum, o) => sum + parseFloat(o.totalAmount || 0), 0);

    return {
      scope: 'business',
      profile: profile || null,
      metrics: {
        total_orders: orders.length,
        total_spent_lkr: parseFloat(totalSpent.toFixed(2)),
        credit_limit: profile ? parseFloat(profile.credit_limit) : 0,
      },
    };
  }

  // 3. SUPPLIER DASHBOARD
  if (userRole === 'supplier') {
    const profile = await SupplierProfile.findOne({ where: { user_id: userId } });

    return {
      scope: 'supplier',
      profile: profile || null,
      metrics: {
        supplier_code: profile ? profile.supplier_code : null,
        rating: profile ? parseFloat(profile.rating) : 5.0,
        payment_terms: profile ? profile.payment_terms : 'Net 30',
      },
    };
  }

  // 4. DELIVERY DASHBOARD
  if (userRole === 'delivery') {
    const [assigned, inTransit, delivered] = await Promise.all([
      Delivery.count({ where: { delivery_staff_id: userId, deliveryStatus: 'assigned' } }),
      Delivery.count({ where: { delivery_staff_id: userId, deliveryStatus: ['picked_up', 'in_transit'] } }),
      Delivery.count({ where: { delivery_staff_id: userId, deliveryStatus: 'delivered' } }),
    ]);

    return {
      scope: 'delivery',
      metrics: {
        pending_pickup: assigned,
        in_transit: inTransit,
        completed_deliveries: delivered,
        total_assigned: assigned + inTransit + delivered,
      },
    };
  }

  // 5. CUSTOMER DASHBOARD
  const [orders, returns, unreadNotifications] = await Promise.all([
    Order.findAll({ where: { user_id: userId }, attributes: ['id', 'total_amount', 'status'] }),
    ReturnRequest.count({ where: { user_id: userId } }),
    Notification.count({ where: { user_id: userId, is_read: false } }),
  ]);

  const totalSpent = orders.reduce((sum, o) => sum + parseFloat(o.total_amount), 0);

  return {
    scope: 'customer',
    metrics: {
      total_orders: orders.length,
      total_spent_lkr: parseFloat(totalSpent.toFixed(2)),
      active_returns: returns,
      unread_notifications: unreadNotifications,
    },
  };
};

module.exports = {
  getDashboardStats,
};

