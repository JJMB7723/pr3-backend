// models/CartItem.js – Items in Shopping Cart
// -------------------------------------------
// Holds chosen variant and quantity with uniqueness on (cartId, productVariantId)

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CartItem = sequelize.define('CartItem', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  cartId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'cart_id',
    references: {
      model: 'carts',
      key: 'id',
    },
  },
  productVariantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'product_variant_id',
    references: {
      model: 'product_variants',
      key: 'id',
    },
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1,
    },
  },
}, {
  tableName: 'cart_items',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ['cart_id', 'product_variant_id'],
      name: 'unique_cart_product_variant',
    },
  ],
});

module.exports = CartItem;
