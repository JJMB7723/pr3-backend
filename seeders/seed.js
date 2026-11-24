// seeders/seed.js – Primary Seeder Entrypoint
// ---------------------------------------------
// Invokes the category seeder for PR3

const runCategorySeeder = require('./seedCategories');

if (require.main === module) {
  runCategorySeeder();
}

module.exports = runCategorySeeder;
