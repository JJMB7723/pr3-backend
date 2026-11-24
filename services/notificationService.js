// services/notificationService.js – In-App Notifications
// -----------------------------------------------------

const { Notification } = require('../models');

const getUserNotifications = async (userId) => {
  return await Notification.findAll({
    where: { user_id: userId },
    order: [['created_at', 'DESC']],
    limit: 50,
  });
};

const getUnreadCount = async (userId) => {
  const count = await Notification.count({
    where: { user_id: userId, is_read: false },
  });
  return { unread_count: count };
};

const markAsRead = async (userId, notificationId) => {
  const notification = await Notification.findOne({
    where: { id: notificationId, user_id: userId },
  });

  if (!notification) {
    const error = new Error('Notification not found.');
    error.statusCode = 404;
    throw error;
  }

  notification.is_read = true;
  await notification.save();
  return notification;
};

const markAllAsRead = async (userId) => {
  await Notification.update(
    { is_read: true },
    { where: { user_id: userId, is_read: false } }
  );
  return { message: 'All notifications marked as read.' };
};

module.exports = {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};

