'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('return_items', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      return_request_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'return_requests',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      order_item_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'order_items',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
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

    await queryInterface.addIndex('return_items', ['return_request_id']);
    await queryInterface.addIndex('return_items', ['order_item_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('return_items');
  },
};

