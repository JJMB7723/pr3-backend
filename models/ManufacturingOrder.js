// models/ManufacturingOrder.js – Work Order Model
// --------------------------------------------------
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ManufacturingOrder = sequelize.define('ManufacturingOrder', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  orderNumber: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'order_number',
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'product_id',
  },
  productVariantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'product_variant_id',
  },
  targetQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'target_quantity',
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'pending',
  },
  rawMaterials: {
    type: DataTypes.JSONB,
    allowNull: true,
    field: 'raw_materials',
  },
  assignedWorkerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'assigned_worker_id',
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'start_date',
  },
  completionDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'completion_date',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'manufacturing_orders',
  timestamps: true,
  underscored: true,
});

module.exports = ManufacturingOrder;

