'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Data Preservation & Conversion Strategy:
    // Update any existing records that used the legacy 'delivery_staff' role to the new 'delivery' role
    await queryInterface.sequelize.query(`
      UPDATE users 
      SET role = 'delivery' 
      WHERE role = 'delivery_staff';
    `);

    // 2. Drop existing constraint if it already exists to avoid errors on rerun
    await queryInterface.sequelize.query(`
      ALTER TABLE users 
      DROP CONSTRAINT IF EXISTS check_user_roles;
    `);

    // 3. Add database-level CHECK constraint enforcing exactly the 5 approved roles
    await queryInterface.sequelize.query(`
      ALTER TABLE users 
      ADD CONSTRAINT check_user_roles 
      CHECK (role IN ('customer', 'business', 'supplier', 'admin', 'delivery'));
    `);
  },

  async down(queryInterface, Sequelize) {
    // 1. Drop the 5-role check constraint
    await queryInterface.sequelize.query(`
      ALTER TABLE users 
      DROP CONSTRAINT IF EXISTS check_user_roles;
    `);

    // 2. Revert 'delivery' back to 'delivery_staff' for safe rollback
    await queryInterface.sequelize.query(`
      UPDATE users 
      SET role = 'delivery_staff' 
      WHERE role = 'delivery';
    `);
  },
};

