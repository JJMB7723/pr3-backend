// models/BusinessProfile.js – B2B Business Profile Model
// -----------------------------------------------------
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BusinessProfile = sequelize.define('BusinessProfile', {
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
  registrationNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'registration_number',
  },
  taxId: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'tax_id',
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  creditLimit: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0.00,
    field: 'credit_limit',
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'is_verified',
  },
}, {
  tableName: 'business_profiles',
  timestamps: true,
  underscored: true,
});

module.exports = BusinessProfile;

