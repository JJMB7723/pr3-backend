// models/Payment.js – Payment Transactions
// ----------------------------------------
// Stores payment method, status, amount and gateway references

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payment = sequelize.define('Payment', {
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
  paymentMethod: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'payment_method',
  },
  paymentStatus: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'pending',
    field: 'payment_status',
    validate: {
      isIn: [['pending', 'successful', 'failed', 'refunded']],
    },
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0,
    },
  },
  transactionReference: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'transaction_reference',
  },
}, {
  tableName: 'payments',
  timestamps: true,
  underscored: true,
});

module.exports = Payment;
