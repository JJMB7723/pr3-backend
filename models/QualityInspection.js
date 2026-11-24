// models/QualityInspection.js – Quality Inspection & QC Clearance Model
// ----------------------------------------------------------------------
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const QualityInspection = sequelize.define('QualityInspection', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  manufacturingOrderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'manufacturing_order_id',
  },
  productVariantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'product_variant_id',
  },
  inspectorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'inspector_id',
  },
  totalInspected: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'total_inspected',
  },
  approvedQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'approved_quantity',
  },
  rejectedQuantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'rejected_quantity',
  },
  status: {
    type: DataTypes.STRING(30),
    allowNull: false,
  },
  defectDetails: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'defect_details',
  },
  inventoryUpdated: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'inventory_updated',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'quality_inspections',
  timestamps: true,
  underscored: true,
});

module.exports = QualityInspection;

