const prisma = require('../../config/prisma');
const { logActivity } = require('../../utils/activityLogger');
const { createNotification } = require('../../utils/notificationHelper');

async function setTarget(data, adminId) {
    const { userId, month, year, targetConversions } = data;

    return prisma.$transaction(async (tx) => {
        const target = await tx.salesTarget.upsert({
            where: {
                userId_month_year: { userId: Number(userId), month: Number(month), year: Number(year) }
            },
            update: { targetConversions: Number(targetConversions), assignedById: adminId },
            create: {
                userId: Number(userId),
                month: Number(month),
                year: Number(year),
                targetConversions: Number(targetConversions),
                assignedById: adminId
            }
        });

        await logActivity(adminId, 'SET_SALES_TARGET', 'SalesTarget', target.id, null, tx);
        return target;
    });
}

function getMonthBounds(month, year) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    return { start, end };
}

async function getDashboardStats(userId, month, year) {
    const target = await prisma.salesTarget.findUnique({
        where: { userId_month_year: { userId: Number(userId), month: Number(month), year: Number(year) } }
    });

    const bounds = getMonthBounds(month, year);

    const converted = await prisma.lead.count({
        where: {
            assignedTo: Number(userId),
            status: 'CONVERTED',
            updatedAt: { gte: bounds.start, lte: bounds.end }
        }
    });

    const now = new Date();
    const daysLeft = now.getMonth() + 1 === month && now.getFullYear() === year 
        ? Math.max(0, bounds.end.getDate() - now.getDate())
        : 0;

    if (!target) {
        return { target: null, converted, progress: 0, remaining: 0, daysLeft };
    }

    const progress = Math.min((converted / target.targetConversions) * 100, 100).toFixed(1);
    const remaining = Math.max(0, target.targetConversions - converted);

    return { target: target.targetConversions, converted, progress: Number(progress), remaining, daysLeft };
}

async function getLeaderboard(month, year) {
    const targets = await prisma.salesTarget.findMany({
        where: { month: Number(month), year: Number(year) },
        include: { user: { select: { name: true } } }
    });

    const bounds = getMonthBounds(month, year);
    const results = [];

    for (const t of targets) {
        const converted = await prisma.lead.count({
            where: {
                assignedTo: t.userId,
                status: 'CONVERTED',
                updatedAt: { gte: bounds.start, lte: bounds.end }
            }
        });
        results.push({
            userId: t.userId,
            name: t.user.name,
            target: t.targetConversions,
            converted,
            progress: Number(((converted / t.targetConversions) * 100).toFixed(1))
        });
    }

    return results.sort((a, b) => b.progress - a.progress);
}

async function getAllTargets(month, year) {
    const targets = await prisma.salesTarget.findMany({
        where: { month: Number(month), year: Number(year) },
        include: { user: { select: { id: true, name: true } } }
    });

    const bounds = getMonthBounds(month, year);
    const results = [];

    for (const t of targets) {
        const converted = await prisma.lead.count({
            where: {
                assignedTo: t.userId,
                status: 'CONVERTED',
                updatedAt: { gte: bounds.start, lte: bounds.end }
            }
        });
        results.push({
            id: t.id,
            user: t.user,
            target: t.targetConversions,
            converted,
            remaining: Math.max(0, t.targetConversions - converted),
            progress: Number(((converted / t.targetConversions) * 100).toFixed(1))
        });
    }

    return results;
}

module.exports = {
    setTarget,
    getDashboardStats,
    getLeaderboard,
    getAllTargets
};
