const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth.middleware');
const authorize = require('../../middlewares/role.middleware');
const messageController = require('./message.controller');

router.use(authMiddleware);


const allRoles = authorize('SUPER_ADMIN', 'HR', 'BDE', 'TELESALES');


router.post('/send', allRoles, messageController.sendMessage);


router.get('/conversations', allRoles, messageController.getConversations);


router.get('/conversation/:userId', allRoles, messageController.getConversation);


router.patch('/:id/read', allRoles, messageController.markAsRead);


router.patch('/conversation/:userId/read', allRoles, messageController.markConversationAsRead);

module.exports = router;
