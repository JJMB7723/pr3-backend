// models/ProductVariant.js – Specific Product Variants
// ----------------------------------------------------
// Handles apparel specific combinations: Size (S, M, L) + Color + SKU + Price

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ProductVariant = sequelize.define('ProductVariant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'product_id',
    references: {
      model: 'products',
      key: 'id',
    },
  },
  sku: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  size: {
    type: DataTypes.STRING(20),
    allowNull: false,
  },
  color: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0,
    },
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active',
  },
}, {
  tableName: 'product_variants',
  timestamps: true,
  underscored: true,
});

module.exports = ProductVariant;
