const prisma = require('../../config/prisma');

async function getNotifications(userId, query = {}) {
    const where = { userId };

    if (query.isRead !== undefined) {
        where.isRead = query.isRead === 'true';
    }

    if (query.type) {
        where.type = query.type;
    }

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        }),
        prisma.notification.count({ where })
    ]);

    return {
        notifications,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

async function markAsRead(id, userId) {
    const notification = await prisma.notification.findUnique({
        where: { id: Number(id) }
    });

    if (!notification) {
        throw new Error('Notification not found');
    }

    if (notification.userId !== userId) {
        throw new Error('Access denied');
    }

    return prisma.notification.update({
        where: { id: Number(id) },
        data: { isRead: true }
    });
}

async function markAllAsRead(userId) {
    await prisma.notification.updateMany({
        where: {
            userId,
            isRead: false
        },
        data: { isRead: true }
    });

    return { success: true, message: 'All notifications marked as read' };
}

async function getUnreadCount(userId) {
    const count = await prisma.notification.count({
        where: {
            userId,
            isRead: false
        }
    });

    return { unreadCount: count };
}

async function deleteNotification(id, userId) {
    const notification = await prisma.notification.findUnique({
        where: { id: Number(id) }
    });

    if (!notification) {
        throw new Error('Notification not found');
    }

    if (notification.userId !== userId) {
        throw new Error('Access denied');
    }

    await prisma.notification.delete({
        where: { id: Number(id) }
    });

    return { success: true, message: 'Notification deleted' };
}

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
    deleteNotification
};
