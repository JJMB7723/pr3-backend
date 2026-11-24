// config/database.js – Sequelize + PostgreSQL connection
// -------------------------------------------------------
// Creates and exports a Sequelize instance supporting both:
// 1. Neon Cloud PostgreSQL (via DATABASE_URL with SSL)
// 2. Local PostgreSQL (via individual DB_* environment variables)

require('dotenv').config();
const { Sequelize } = require('sequelize');

// Connection pool configuration optimized for serverless / cloud databases
const poolConfig = {
  max: 5,         // maximum number of connection instances in pool
  min: 0,         // minimum number of connection instances in pool
  acquire: 30000, // maximum time (ms) Sequelize will try to get a connection before throwing error
  idle: 10000,    // maximum time (ms) a connection can be idle before being released
};

let sequelize;

if (process.env.DATABASE_URL) {
  // Option A: Connect to Neon Cloud PostgreSQL using connection string
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false, // keep console logs clean
    pool: poolConfig,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // required for Neon cloud SSL certificates
      },
    },
  });
} else {
  // Option B: Fallback to local PostgreSQL using individual variables
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: false,
      pool: poolConfig,
    }
  );
}

// Function to test and establish the database connection
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    const mode = process.env.DATABASE_URL ? 'Neon Cloud' : 'Local';
    console.log(`✅ PostgreSQL connected successfully (${mode} mode).`);
  } catch (error) {
    // Log safe error message without printing database credentials or connection strings
    console.error('❌ Unable to connect to PostgreSQL database.');
    console.error('   Error details:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };
