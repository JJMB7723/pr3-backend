// models/Return.js – Legacy Return Model (Superseded)
// ----------------------------------------------------
// ARCHITECTURE NOTE:
// This model has been superseded by the normalized header-item return pattern:
// 1. `ReturnRequest.js` – High-level return request (order, user, status, reason)
// 2. `ReturnItem.js` – Individual line items returned from an order
// These match the active migrations `return_requests` and `return_items`.
// This file is retained for reference and will not conflict with active migrations.

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Return = sequelize.define('Return', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  orderItemId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'order_item_id',
    references: {
      model: 'order_items',
      key: 'id',
    },
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
  reason: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'requested',
    validate: {
      isIn: [['requested', 'approved', 'rejected', 'completed']],
    },
  },
  refundAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'refund_amount',
    validate: {
      min: 0,
    },
  },
}, {
  tableName: 'returns',
  timestamps: true,
  underscored: true,
});

module.exports = Return;

