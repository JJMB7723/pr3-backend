// routes/healthRoutes.js – Health check routes
// ------------------------------------------------
// Provides simple endpoints to verify that the Express server
// and PostgreSQL database are running properly.

const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/database');

// GET /api/health – basic health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'PR3 backend is running',
  });
});

// GET /api/health/db – reports PostgreSQL connection status separately
router.get('/health/db', async (req, res) => {
  try {
    await sequelize.authenticate();
    res.status(200).json({
      success: true,
      database: 'connected',
      message: 'PostgreSQL connection is healthy',
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      database: 'disconnected',
      message: 'Unable to connect to PostgreSQL',
    });
  }
});

module.exports = router;
