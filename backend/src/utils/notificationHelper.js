const defaultPrisma = require('../config/prisma');

async function createNotification(userId, title, message, type = 'INFO', io = null, tx = defaultPrisma) {
    try {
        const notification = await tx.notification.create({
            data: {
                userId,
                title,
                message,
                type
            }
        });

        
        if (io) {
            io.to(`user_${userId}`).emit('new_notification', notification);
        }

        return notification;
    } catch (error) {
        console.error('Notification error:', error.message);
    }
}

module.exports = { createNotification };
