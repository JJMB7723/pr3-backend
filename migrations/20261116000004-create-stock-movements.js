'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('stock_movements', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
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
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      type: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      balance_after: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      reference_type: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      reference_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      reason: {
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

    await queryInterface.addIndex('stock_movements', ['product_variant_id']);
    await queryInterface.addIndex('stock_movements', ['type']);
    await queryInterface.addIndex('stock_movements', ['created_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('stock_movements');
  },
};

