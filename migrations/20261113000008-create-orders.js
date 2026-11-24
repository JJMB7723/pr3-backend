'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('orders', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      order_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      total_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      order_status: {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: 'pending',
      },
      shipping_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      shipping_phone: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      shipping_address: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      shipping_city: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      shipping_state: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      shipping_postal_code: {
        type: Sequelize.STRING(20),
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

    await queryInterface.addIndex('orders', ['user_id']);
    await queryInterface.addIndex('orders', ['order_number']);
    await queryInterface.addIndex('orders', ['order_status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('orders');
  },
};

