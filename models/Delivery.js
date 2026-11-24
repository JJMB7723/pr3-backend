// models/Delivery.js – Deliveries Tracking
// ----------------------------------------
// Stores order delivery assignments to delivery staff

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Delivery = sequelize.define('Delivery', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    field: 'order_id',
    references: {
      model: 'orders',
      key: 'id',
    },
  },
  deliveryStaffId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'delivery_staff_id',
    references: {
      model: 'users',
      key: 'id',
    },
  },
  deliveryStatus: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'assigned',
    field: 'delivery_status',
    validate: {
      isIn: [['assigned', 'picked_up', 'in_transit', 'delivered', 'failed']],
    },
  },
  trackingNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true,
    field: 'tracking_number',
  },
  assignedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'assigned_at',
  },
  deliveredAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'delivered_at',
  },
}, {
  tableName: 'deliveries',
  timestamps: true,
  underscored: true,
});

module.exports = Delivery;
