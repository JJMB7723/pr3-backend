// models/User.js – System Users
// ------------------------------
// Stores users across 5 system roles:
// 1. customer
// 2. business
// 3. supplier
// 4. admin
// 5. delivery

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { ALL_ROLES } = require('../config/roles');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  firstName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'first_name',
  },
  lastName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'last_name',
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  passwordHash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'password_hash',
  },
  role: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'customer',
    validate: {
      isIn: {
        args: [ALL_ROLES],
        msg: `Role must be one of: ${ALL_ROLES.join(', ')}`,
      },
    },
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: 'is_active',
  },
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
});

module.exports = User;
