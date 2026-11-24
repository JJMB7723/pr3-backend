'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('production_records', {
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
      stage: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },
      quantity_processed: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      worker_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'in_progress',
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

    await queryInterface.addIndex('production_records', ['manufacturing_order_id']);
    await queryInterface.addIndex('production_records', ['stage']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('production_records');
  },
};

