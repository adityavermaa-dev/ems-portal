const defaultPrisma = require('../config/prisma');

async function logActivity(userId, action, entityType, entityId = null, details = null, tx = defaultPrisma) {
    try {
        await tx.activityLog.create({
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
