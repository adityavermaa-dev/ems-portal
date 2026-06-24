const prisma = require('../../config/prisma');
const { logActivity } = require('../../utils/activityLogger');
const { createNotification } = require('../../utils/notificationHelper');

async function createLeaveRequest(data, userId, io) {
    if (!data.startDate || !data.endDate || !data.type || !data.reason) {
        throw new Error('Start date, end date, type, and reason are required');
    }

    return prisma.$transaction(async (tx) => {
        const leave = await tx.leaveRequest.create({
            data: {
                userId,
                type: data.type,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                reason: data.reason
            },
            include: { user: { select: { name: true, role: { select: { name: true } } } } }
        });

        await logActivity(userId, 'CREATE_LEAVE_REQUEST', 'LeaveRequest', leave.id, null, tx);

        // Notify HR and SUPER_ADMIN
        const admins = await tx.user.findMany({
            where: { role: { name: { in: ['SUPER_ADMIN', 'HR'] } } },
            select: { id: true }
        });

        const notifications = admins.map(admin => 
            createNotification(
                admin.id,
                'New Leave Request',
                `${leave.user.name} has requested ${data.type} leave.`,
                'INFO',
                io,
                tx
            )
        );
        await Promise.all(notifications);

        return leave;
    });
}

async function getMyLeaveRequests(userId) {
    return prisma.leaveRequest.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: { reviewer: { select: { name: true } } }
    });
}

async function getAllLeaveRequests() {
    return prisma.leaveRequest.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
            user: { select: { id: true, name: true, email: true, role: { select: { name: true } } } },
            reviewer: { select: { name: true } }
        }
    });
}

async function updateLeaveStatus(requestId, status, reviewerId, io) {
    if (!['APPROVED', 'REJECTED'].includes(status)) {
        throw new Error('Invalid status');
    }

    return prisma.$transaction(async (tx) => {
        const leave = await tx.leaveRequest.findUnique({
            where: { id: Number(requestId) }
        });

        if (!leave) throw new Error('Leave request not found');

        const updatedLeave = await tx.leaveRequest.update({
            where: { id: Number(requestId) },
            data: { status, reviewerId },
            include: { user: { select: { name: true, id: true } } }
        });

        await logActivity(reviewerId, `UPDATE_LEAVE_${status}`, 'LeaveRequest', leave.id, null, tx);

        await createNotification(
            leave.userId,
            `Leave Request ${status}`,
            `Your leave request from ${new Date(leave.startDate).toLocaleDateString()} was ${status.toLowerCase()}.`,
            status === 'APPROVED' ? 'SUCCESS' : 'WARNING',
            io,
            tx
        );

        return updatedLeave;
    });
}

module.exports = {
    createLeaveRequest,
    getMyLeaveRequests,
    getAllLeaveRequests,
    updateLeaveStatus
};
