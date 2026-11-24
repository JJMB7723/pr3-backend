// migrations/runMigrations.js – Lightweight Migration Runner
// -----------------------------------------------------------
// Executes all pending migrations in alphabetical/timestamp order
// using Sequelize queryInterface without requiring global CLI tools.

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const { sequelize } = require('../config/database');

const runMigrations = async () => {
  const queryInterface = sequelize.getQueryInterface();

  try {
    console.log('🔄 Checking database connection and migration status...');
    await sequelize.authenticate();

    // 1. Create the tracking table SequelizeMeta if it doesn't exist
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS "SequelizeMeta" (
        "name" VARCHAR(255) NOT NULL PRIMARY KEY
      );
    `);

    // 2. Fetch already executed migrations
    const [rows] = await sequelize.query(`SELECT "name" FROM "SequelizeMeta" ORDER BY "name" ASC;`);
    const executedMigrations = rows.map((r) => r.name);

    // 3. Find all migration files in migrations directory
    const migrationsDir = path.join(__dirname);
    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.js') && file !== 'runMigrations.js')
      .sort();

    const pending = files.filter((file) => !executedMigrations.includes(file));

    if (pending.length === 0) {
      console.log('✅ Database is already up to date. No pending migrations.');
      return;
    }

    console.log(`📦 Found ${pending.length} pending migration(s) to execute:`);

    // 4. Run each pending migration in sequence
    for (const file of pending) {
      console.log(`  ▶ Executing migration: ${file}`);
      const migration = require(path.join(migrationsDir, file));

      // Execute up()
      await migration.up(queryInterface, Sequelize);

      // Record in SequelizeMeta
      await sequelize.query(`INSERT INTO "SequelizeMeta" ("name") VALUES (:name);`, {
        replacements: { name: file },
      });

      console.log(`  ✔ Completed: ${file}`);
    }

    console.log('🎉 All migrations applied successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
};

if (require.main === module) {
  runMigrations();
}

module.exports = runMigrations;

