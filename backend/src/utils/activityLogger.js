const prisma = require('../config/prisma');

async function logActivity(userId, action, entityType, entityId = null, details = null) {
    try {
        await prisma.activityLog.create({
            data: {
                userId,
                action,
                entityType,
                entityId,
                details
            }
        });
    } catch (error) {
        console.error('Activity log error:', error.message);
    }
}

module.exports = { logActivity };
