// scripts/verifyDatabase.js – Verify DB Tables and Foreign Keys
// -------------------------------------------------------------

require('dotenv').config();
const { sequelize, Category } = require('../models');

async function verify() {
  try {
    console.log('--- TABLES IN POSTGRESQL ---');
    const tables = await sequelize.getQueryInterface().showAllTables();
    console.log(tables.sort().join('\n'));

    console.log('\n--- SEEDED CATEGORIES ---');
    const categories = await Category.findAll({ order: [['id', 'ASC']] });
    categories.forEach((c) =>
      console.log(`ID: ${c.id} | Name: ${c.name} | Slug: ${c.slug} | Active: ${c.isActive}`)
    );

    console.log('\n--- FOREIGN KEYS IN DATABASE ---');
    const [fkList] = await sequelize.query(`
      SELECT
          tc.table_name, 
          kcu.column_name, 
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name 
      FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
      ORDER BY tc.table_name;
    `);

    fkList.forEach((fk) => {
      console.log(`${fk.table_name}.${fk.column_name} -> ${fk.foreign_table_name}.${fk.foreign_column_name}`);
    });

    console.log('\n✅ Database verification successfully completed.');
  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await sequelize.close();
  }
}

verify();

