// models/Inventory.js – Stock Tracking
// ------------------------------------
// Tracks physical stock quantities per specific product variant

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Inventory = sequelize.define('Inventory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  productVariantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    field: 'product_variant_id',
    references: {
      model: 'product_variants',
      key: 'id',
    },
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
    },
  },
}, {
  tableName: 'inventory',
  timestamps: true,
  underscored: true,
});

module.exports = Inventory;
