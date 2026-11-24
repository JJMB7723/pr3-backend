// server.js – application entry point
// ------------------------------------
// Loads environment variables FIRST, then connects to PostgreSQL,
// then starts the Express server.

// Step 0 – load .env BEFORE anything else (so all require'd modules
//          can read process.env.DB_NAME, etc.)
require('dotenv').config();

const app = require('./app');
const { connectDB } = require('./config/database');

const PORT = process.env.PORT || 5000;

// Start the server only after the database connects
const startServer = async () => {
  try {
    // Step 1 – connect to PostgreSQL
    await connectDB();

    // Step 2 – start listening for requests
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
