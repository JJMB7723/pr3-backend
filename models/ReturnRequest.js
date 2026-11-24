// models/ReturnRequest.js – Customer Return Requests
// ---------------------------------------------------
// Stores order return requests filed by customers

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ReturnRequest = sequelize.define('ReturnRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'order_id',
    references: {
      model: 'orders',
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
  returnStatus: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'requested',
    field: 'return_status',
    validate: {
      isIn: [['requested', 'approved', 'rejected', 'picked_up', 'completed']],
    },
  },
}, {
  tableName: 'return_requests',
  timestamps: true,
  underscored: true,
});

module.exports = ReturnRequest;

