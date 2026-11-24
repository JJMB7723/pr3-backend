// models/StockMovement.js – Inventory Stock Movement Log
// -------------------------------------------------------
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StockMovement = sequelize.define('StockMovement', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  productVariantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'product_variant_id',
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'user_id',
  },
  type: {
    type: DataTypes.STRING(30),
    allowNull: false,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  balanceAfter: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'balance_after',
  },
  referenceType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'reference_type',
  },
  referenceId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'reference_id',
  },
  reason: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'stock_movements',
  timestamps: true,
  underscored: true,
});

module.exports = StockMovement;

