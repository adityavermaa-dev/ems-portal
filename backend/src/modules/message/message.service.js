const prisma = require('../../config/prisma');

async function sendMessage(senderId, receiverId, content) {
    // Verify receiver exists
    const receiver = await prisma.user.findUnique({
        where: { id: Number(receiverId) }
    });

    if (!receiver) {
        throw new Error('Receiver not found');
    }

    if (!receiver.isActive) {
        throw new Error('Cannot send message to inactive user');
    }

    if (senderId === Number(receiverId)) {
        throw new Error('Cannot send message to yourself');
    }

    const message = await prisma.message.create({
        data: {
            senderId,
            receiverId: Number(receiverId),
            content
        },
        include: {
            sender: { select: { id: true, name: true, email: true } },
            receiver: { select: { id: true, name: true, email: true } }
        }
    });

    return message;
}

async function getConversation(userId, otherUserId, query = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 50;
    const skip = (page - 1) * limit;

    const where = {
        OR: [
            { senderId: userId, receiverId: Number(otherUserId) },
            { senderId: Number(otherUserId), receiverId: userId }
        ]
    };

    const [messages, total] = await Promise.all([
        prisma.message.findMany({
            where,
            include: {
                sender: { select: { id: true, name: true } },
                receiver: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        }),
        prisma.message.count({ where })
    ]);

    return {
        messages: messages.reverse(),
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

async function getConversations(userId) {
    // Get all unique conversations with latest message
    const sentMessages = await prisma.message.findMany({
        where: { senderId: userId },
        select: { receiverId: true },
        distinct: ['receiverId']
    });

    const receivedMessages = await prisma.message.findMany({
        where: { receiverId: userId },
        select: { senderId: true },
        distinct: ['senderId']
    });

    // Collect unique user IDs
    const userIds = new Set();
    sentMessages.forEach(m => userIds.add(m.receiverId));
    receivedMessages.forEach(m => userIds.add(m.senderId));

    // For each unique user, get the latest message and unread count
    const conversations = [];

    for (const otherUserId of userIds) {
        const [latestMessage, unreadCount, otherUser] = await Promise.all([
            prisma.message.findFirst({
                where: {
                    OR: [
                        { senderId: userId, receiverId: otherUserId },
                        { senderId: otherUserId, receiverId: userId }
                    ]
                },
                orderBy: { createdAt: 'desc' },
                include: {
                    sender: { select: { id: true, name: true } }
                }
            }),
            prisma.message.count({
                where: {
                    senderId: otherUserId,
                    receiverId: userId,
                    isRead: false
                }
            }),
            prisma.user.findUnique({
                where: { id: otherUserId },
                select: { id: true, name: true, email: true, isActive: true }
            })
        ]);

        conversations.push({
            user: otherUser,
            lastMessage: latestMessage,
            unreadCount
        });
    }

    // Sort by latest message timestamp
    conversations.sort((a, b) => {
        const aTime = a.lastMessage?.createdAt || 0;
        const bTime = b.lastMessage?.createdAt || 0;
        return new Date(bTime) - new Date(aTime);
    });

    return conversations;
}

async function markAsRead(messageId, userId) {
    const message = await prisma.message.findUnique({
        where: { id: Number(messageId) }
    });

    if (!message) {
        throw new Error('Message not found');
    }

    if (message.receiverId !== userId) {
        throw new Error('You can only mark your own received messages as read');
    }

    if (message.isRead) {
        return message;
    }

    return prisma.message.update({
        where: { id: Number(messageId) },
        data: {
            isRead: true,
            readAt: new Date()
        },
        include: {
            sender: { select: { id: true, name: true } },
            receiver: { select: { id: true, name: true } }
        }
    });
}

async function markConversationAsRead(userId, otherUserId) {
    await prisma.message.updateMany({
        where: {
            senderId: Number(otherUserId),
            receiverId: userId,
            isRead: false
        },
        data: {
            isRead: true,
            readAt: new Date()
        }
    });

    return { success: true };
}

module.exports = {
    sendMessage,
    getConversation,
    getConversations,
    markAsRead,
    markConversationAsRead
};
