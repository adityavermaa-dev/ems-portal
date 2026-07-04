const prisma = require("../../config/prisma");

const chatTools = {
    getLeadStats: async () => {
        const stats = await prisma.lead.groupBy({
            by: ['status'],
            _count: {
                id: true
            }
        });
        const total = await prisma.lead.count();
        return { total, stats };
    },
    
    getConversionRatio: async () => {
        const total = await prisma.lead.count();
        const converted = await prisma.lead.count({
            where: { status: 'CONVERTED' }
        });
        return {
            total,
            converted,
            ratio: total > 0 ? (converted / total) * 100 : 0
        };
    },

    getTaskStats: async () => {
        const stats = await prisma.task.groupBy({
            by: ['status'],
            _count: {
                id: true
            }
        });
        return { stats };
    },

    getAttendanceSummary: async ({ date }) => {
        const targetDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
        const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));
        
        const attendance = await prisma.attendance.groupBy({
            by: ['status'],
            where: {
                date: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            },
            _count: {
                id: true
            }
        });
        return { date: startOfDay.toISOString().split('T')[0], attendance };
    },

    getPendingLeaves: async () => {
        const leaves = await prisma.leaveRequest.findMany({
            where: { status: 'PENDING' },
            include: { user: { select: { name: true } } }
        });
        return { pendingLeavesCount: leaves.length, leaves };
    },

    getUsersSummary: async () => {
        const users = await prisma.user.groupBy({
            by: ['isActive'],
            _count: { id: true }
        });
        const roles = await prisma.user.findMany({
            select: {
                role: {
                    select: { name: true }
                }
            }
        });
        const roleCounts = roles.reduce((acc, curr) => {
            const roleName = curr.role?.name || 'Unknown';
            acc[roleName] = (acc[roleName] || 0) + 1;
            return acc;
        }, {});

        return { users, roleCounts };
    },

    getRecentActivity: async ({ limit = 5 }) => {
        const activities = await prisma.activityLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: { user: { select: { name: true } } }
        });
        return { activities };
    }
};

const chatToolDeclarations = [
    {
        name: "getLeadStats",
        description: "Get the total number of leads and their breakdown by status.",
    },
    {
        name: "getConversionRatio",
        description: "Get the ratio and percentage of converted leads.",
    },
    {
        name: "getTaskStats",
        description: "Get the count of tasks grouped by their status (e.g. PENDING, COMPLETED).",
    },
    {
        name: "getAttendanceSummary",
        description: "Get the attendance summary (count of PRESENT, ABSENT, etc.) for a given date.",
        parameters: {
            type: "OBJECT",
            properties: {
                date: {
                    type: "STRING",
                    description: "The date in YYYY-MM-DD format. If omitted, uses today."
                }
            }
        }
    },
    {
        name: "getPendingLeaves",
        description: "Get a list of all pending leave requests and their count.",
    },
    {
        name: "getUsersSummary",
        description: "Get the count of active/inactive users and the distribution of users by role.",
    },
    {
        name: "getRecentActivity",
        description: "Get the most recent activity logs from the system.",
        parameters: {
            type: "OBJECT",
            properties: {
                limit: {
                    type: "NUMBER",
                    description: "The number of recent activities to fetch. Default is 5."
                }
            }
        }
    }
];

module.exports = {
    chatTools,
    chatToolDeclarations
};
