const prisma = require('../../config/prisma');

async function getActivityLogs(query = {}) {
    const where = {};

    if (query.userId) {
        where.userId = Number(query.userId);
    }

    if (query.action) {
        where.action = query.action;
    }

    if (query.entityType) {
        where.entityType = query.entityType;
    }

    if (query.startDate && query.endDate) {
        const start = new Date(query.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt = { gte: start, lte: end };
    }

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 30;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
        prisma.activityLog.findMany({
            where,
            include: {
                user: {
                    select: { id: true, name: true, email: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        }),
        prisma.activityLog.count({ where })
    ]);

    return {
        logs,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

async function getUserActivityLogs(userId, query = {}) {
    return getActivityLogs({ ...query, userId });
}

async function getMyActivityLogs(userId, query = {}) {
    return getActivityLogs({ ...query, userId });
}

module.exports = {
    getActivityLogs,
    getUserActivityLogs,
    getMyActivityLogs
};
