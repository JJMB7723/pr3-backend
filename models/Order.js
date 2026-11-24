// models/Order.js – Customer Orders
// ---------------------------------
// Represents orders with complete shipping address snapshot

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id',
    },
  },
  orderNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'order_number',
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    field: 'total_amount',
    validate: {
      min: 0,
    },
  },
  orderStatus: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'pending',
    field: 'order_status',
    validate: {
      isIn: [['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']],
    },
  },
  shippingName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'shipping_name',
  },
  shippingPhone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'shipping_phone',
  },
  shippingAddress: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'shipping_address',
  },
  shippingCity: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'shipping_city',
  },
  shippingState: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'shipping_state',
  },
  shippingPostalCode: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'shipping_postal_code',
  },
}, {
  tableName: 'orders',
  timestamps: true,
  underscored: true,
});

module.exports = Order;
