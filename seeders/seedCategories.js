// seeders/seedCategories.js – Category Seeder Runner
// ----------------------------------------------------
// Seeds the 4 initial categories (Shirt, Pant, Shorts, Jersey)

require('dotenv').config();
const { Sequelize } = require('sequelize');
const { sequelize } = require('../config/database');
const categorySeeder = require('./20261113000001-seed-categories');

const runCategorySeeder = async () => {
  const queryInterface = sequelize.getQueryInterface();

  try {
    console.log('🌱 Seeding initial categories into PostgreSQL...');
    await sequelize.authenticate();

    await categorySeeder.up(queryInterface, Sequelize);

    console.log('✅ Four initial categories successfully seeded:');
    console.log('   1. Shirt');
    console.log('   2. Pant');
    console.log('   3. Shorts');
    console.log('   4. Jersey');
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

if (require.main === module) {
  runCategorySeeder();
}

module.exports = runCategorySeeder;

