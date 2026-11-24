// models/ReturnItem.js – Items in a Return Request
// -------------------------------------------------
// Stores individual items and quantities requested for return

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ReturnItem = sequelize.define('ReturnItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  returnRequestId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'return_request_id',
    references: {
      model: 'return_requests',
      key: 'id',
    },
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
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
    },
  },
}, {
  tableName: 'return_items',
  timestamps: true,
  underscored: true,
});

module.exports = ReturnItem;

