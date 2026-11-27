'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Create coupons table
    await queryInterface.createTable('coupons', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      description: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      discount_type: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'percentage',
      },
      discount_value: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      min_order_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
      },
      max_discount_amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      usage_limit: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      used_count: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // 2. Add coupon_code and discount_amount to orders table
    await queryInterface.addColumn('orders', 'coupon_code', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });
    await queryInterface.addColumn('orders', 'discount_amount', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    });

    // 3. Seed starter retail coupons
    await queryInterface.bulkInsert('coupons', [
      {
        code: 'PR3SAVE10',
        description: '10% off any order',
        discount_type: 'percentage',
        discount_value: 10.00,
        min_order_amount: 0,
        max_discount_amount: null,
        usage_limit: null,
        used_count: 0,
        is_active: true,
      },
      {
        code: 'WELCOME20',
        description: '20% off orders $100+ (up to $100 discount)',
        discount_type: 'percentage',
        discount_value: 20.00,
        min_order_amount: 100.00,
        max_discount_amount: 100.00,
        usage_limit: null,
        used_count: 0,
        is_active: true,
      },
      {
        code: 'FLAT50',
        description: '$50 off orders $200+',
        discount_type: 'fixed',
        discount_value: 50.00,
        min_order_amount: 200.00,
        max_discount_amount: null,
        usage_limit: null,
        used_count: 0,
        is_active: true,
      },
      {
        code: 'VIP100',
        description: '$100 off orders $500+',
        discount_type: 'fixed',
        discount_value: 100.00,
        min_order_amount: 500.00,
        max_discount_amount: null,
        usage_limit: null,
        used_count: 0,
        is_active: true,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('orders', 'discount_amount');
    await queryInterface.removeColumn('orders', 'coupon_code');
    await queryInterface.dropTable('coupons');
  },
};
