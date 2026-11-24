// models/Role.js – User Roles (Deprecated / Reference Only)
// -------------------------------------------------------------
// ARCHITECTURE NOTE:
// In Phase 3.1, user roles were consolidated directly into the `users` table
// using the `role` column with a PostgreSQL CHECK constraint.
// The active 5 roles ('customer', 'business', 'supplier', 'admin', 'delivery')
// are managed through config/roles.js and models/User.js.
// This file is retained for reference and will not conflict with active migrations.

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING(30),
    allowNull: false,
    unique: true,
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
}, {
  tableName: 'roles',
  timestamps: true,
  underscored: true, // creates created_at and updated_at
});

module.exports = Role;

