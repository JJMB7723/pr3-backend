// routes/authRoutes.js – Authentication Routes
// ----------------------------------------------
// Registers public and protected authentication API endpoints

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const {
  validateRegistrationMiddleware,
  validateLoginMiddleware,
} = require('../validations/authValidation');
const { protect } = require('../middlewares/authMiddleware');
const { authorizeRoles } = require('../middlewares/roleMiddleware');

// ----- Public Routes -----
// POST /api/auth/register – Public user registration
router.post('/register', validateRegistrationMiddleware, authController.register);

// POST /api/auth/login – User authentication & JWT generation
router.post('/login', validateLoginMiddleware, authController.login);

// ----- Protected Routes -----
// GET /api/auth/me – Current authenticated user profile (all roles)
router.get('/me', protect, authController.getMe);

// GET /api/auth/admin-only – Protected route restricted to admin role
router.get('/admin-only', protect, authorizeRoles('admin'), authController.adminOnly);

module.exports = router;
