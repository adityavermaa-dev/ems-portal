const notificationService = require('./notification.service');

async function getNotifications(req, res) {
    try {
        const result = await notificationService.getNotifications(
            req.user.userId,
            req.query
        );
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

async function markAsRead(req, res) {
    try {
        const notification = await notificationService.markAsRead(
            req.params.id,
            req.user.userId
        );
        res.json({ success: true, data: notification });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

async function markAllAsRead(req, res) {
    try {
        const result = await notificationService.markAllAsRead(req.user.userId);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

async function getUnreadCount(req, res) {
    try {
        const result = await notificationService.getUnreadCount(req.user.userId);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

async function deleteNotification(req, res) {
    try {
        const result = await notificationService.deleteNotification(
            req.params.id,
            req.user.userId
        );
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
    deleteNotification
};
