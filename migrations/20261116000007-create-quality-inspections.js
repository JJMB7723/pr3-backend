'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('quality_inspections', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      manufacturing_order_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'manufacturing_orders',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      product_variant_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'product_variants',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      inspector_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      total_inspected: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      approved_quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      rejected_quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },
      defect_details: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      inventory_updated: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    await queryInterface.addIndex('quality_inspections', ['manufacturing_order_id']);
    await queryInterface.addIndex('quality_inspections', ['status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('quality_inspections');
  },
};

