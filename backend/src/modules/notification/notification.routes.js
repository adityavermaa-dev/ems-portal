const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth.middleware');
const authorize = require('../../middlewares/role.middleware');
const notificationController = require('./notification.controller');

router.use(authMiddleware);


const allRoles = authorize('SUPER_ADMIN', 'HR', 'BDE', 'TELESALES');


router.get('/unread-count', allRoles, notificationController.getUnreadCount);


router.get('/', allRoles, notificationController.getNotifications);


router.patch('/read-all', allRoles, notificationController.markAllAsRead);


router.patch('/:id/read', allRoles, notificationController.markAsRead);


router.delete('/:id', allRoles, notificationController.deleteNotification);

module.exports = router;
