'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('supplier_profiles', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      company_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      supplier_code: {
        type: Sequelize.STRING(30),
        allowNull: false,
        unique: true,
      },
      contact_person: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      payment_terms: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: 'Net 30',
      },
      rating: {
        type: Sequelize.DECIMAL(3, 2),
        allowNull: false,
        defaultValue: 5.00,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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

    await queryInterface.addIndex('supplier_profiles', ['user_id']);
    await queryInterface.addIndex('supplier_profiles', ['supplier_code']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('supplier_profiles');
  },
};

