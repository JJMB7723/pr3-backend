// models/Cart.js – Shopping Cart
// ------------------------------
// Represents customer shopping carts with status 'active' or 'checked_out'

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Cart = sequelize.define('Cart', {
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
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'active',
    validate: {
      isIn: [['active', 'checked_out']],
    },
  },
}, {
  tableName: 'carts',
  timestamps: true,
  underscored: true,
});

module.exports = Cart;
