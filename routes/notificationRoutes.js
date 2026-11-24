// routes/notificationRoutes.js – Notification Routes
// --------------------------------------------------

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

// GET /api/notifications – Get all notifications for logged-in user
router.get('/', notificationController.getNotifications);

// GET /api/notifications/unread-count – Get unread notifications count
router.get('/unread-count', notificationController.getUnreadCount);

// PATCH /api/notifications/:id/read – Mark single notification as read
router.patch('/:id/read', notificationController.markRead);

// PATCH /api/notifications/read-all – Mark all notifications as read
router.patch('/read-all', notificationController.markAllRead);

module.exports = router;

