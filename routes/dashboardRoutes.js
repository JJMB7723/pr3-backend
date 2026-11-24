// routes/dashboardRoutes.js – Dashboard & Analytics Routes
// --------------------------------------------------------

const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

// GET /api/dashboard – Role-appropriate aggregated analytics
router.get('/', dashboardController.getDashboard);

module.exports = router;

