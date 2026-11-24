// models/SupplierProfile.js – Vendor / Supplier Profile Model
// -----------------------------------------------------------
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SupplierProfile = sequelize.define('SupplierProfile', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    field: 'user_id',
  },
  companyName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'company_name',
  },
  supplierCode: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true,
    field: 'supplier_code',
  },
  contactPerson: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'contact_person',
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  paymentTerms: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'Net 30',
    field: 'payment_terms',
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    defaultValue: 5.00,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active',
  },
}, {
  tableName: 'supplier_profiles',
  timestamps: true,
  underscored: true,
});

module.exports = SupplierProfile;

