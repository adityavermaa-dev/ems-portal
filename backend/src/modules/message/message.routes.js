const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth.middleware');
const authorize = require('../../middlewares/role.middleware');
const messageController = require('./message.controller');

router.use(authMiddleware);

// All authenticated users can use messaging
const allRoles = authorize('SUPER_ADMIN', 'HR', 'BDE', 'TELESALES');

// Send message
router.post('/send', allRoles, messageController.sendMessage);

// Get all conversations list
router.get('/conversations', allRoles, messageController.getConversations);

// Get conversation with specific user
router.get('/conversation/:userId', allRoles, messageController.getConversation);

// Mark single message as read
router.patch('/:id/read', allRoles, messageController.markAsRead);

// Mark entire conversation as read
router.patch('/conversation/:userId/read', allRoles, messageController.markConversationAsRead);

module.exports = router;
