// models/ProductionRecord.js – Production Stage Progress Model
// -------------------------------------------------------------
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ProductionRecord = sequelize.define('ProductionRecord', {
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
  stage: {
    type: DataTypes.STRING(30),
    allowNull: false,
  },
  quantityProcessed: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'quantity_processed',
  },
  workerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'worker_id',
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'in_progress',
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'production_records',
  timestamps: true,
  underscored: true,
});

module.exports = ProductionRecord;

