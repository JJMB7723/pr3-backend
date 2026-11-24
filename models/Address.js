// models/Address.js – Customer Saved Address Book (Future Feature)
// -----------------------------------------------------------------
// ARCHITECTURE NOTE:
// For completed orders, shipping address information is saved directly
// as an immutable snapshot on the `orders` table (e.g. shipping_address, city).
// This `Address` model is designed for a future customer Address Book feature,
// allowing customers to store and choose multiple saved addresses at checkout.

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Address = sequelize.define('Address', {
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
  addressLine1: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'address_line1',
  },
  addressLine2: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'address_line2',
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  stateProvince: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'state_province',
  },
  postalCode: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'postal_code',
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'Sri Lanka',
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_default',
  },
}, {
  tableName: 'addresses',
  timestamps: true,
  underscored: true,
});

module.exports = Address;

