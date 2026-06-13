const messageService = require('./message.service');
const { logActivity } = require('../../utils/activityLogger');

async function sendMessage(req, res) {
    try {
        const { receiverId, content } = req.body;

        if (!receiverId || !content) {
            return res.status(400).json({
                success: false,
                message: 'receiverId and content are required'
            });
        }

        const message = await messageService.sendMessage(
            req.user.userId,
            receiverId,
            content
        );

        await logActivity(req.user.userId, 'SEND_MESSAGE', 'Message', message.id);

        // Emit via Socket.IO for real-time delivery
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${receiverId}`).emit('new_message', message);
        }

        res.status(201).json({ success: true, data: message });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

async function getConversation(req, res) {
    try {
        const result = await messageService.getConversation(
            req.user.userId,
            req.params.userId,
            req.query
        );
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

async function getConversations(req, res) {
    try {
        const conversations = await messageService.getConversations(req.user.userId);
        res.json({ success: true, data: conversations });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

async function markAsRead(req, res) {
    try {
        const message = await messageService.markAsRead(
            req.params.id,
            req.user.userId
        );

        // Notify sender that message was read
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${message.senderId}`).emit('message_read', {
                messageId: message.id,
                readAt: message.readAt
            });
        }

        res.json({ success: true, data: message });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

async function markConversationAsRead(req, res) {
    try {
        await messageService.markConversationAsRead(
            req.user.userId,
            req.params.userId
        );

        // Notify sender that messages were read
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${req.params.userId}`).emit('messages_read', {
                readBy: req.user.userId
            });
        }

        res.json({ success: true, message: 'Conversation marked as read' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

module.exports = {
    sendMessage,
    getConversation,
    getConversations,
    markAsRead,
    markConversationAsRead
};
