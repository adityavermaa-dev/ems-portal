const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth.middleware');
const authorize = require('../../middlewares/role.middleware');
const notificationController = require('./notification.controller');

router.use(authMiddleware);

// All authenticated users can manage their notifications
const allRoles = authorize('SUPER_ADMIN', 'HR', 'BDE', 'TELESALES');

// Get unread count
router.get('/unread-count', allRoles, notificationController.getUnreadCount);

// Get notifications
router.get('/', allRoles, notificationController.getNotifications);

// Mark all as read
router.patch('/read-all', allRoles, notificationController.markAllAsRead);

// Mark single as read
router.patch('/:id/read', allRoles, notificationController.markAsRead);

// Delete notification
router.delete('/:id', allRoles, notificationController.deleteNotification);

module.exports = router;
