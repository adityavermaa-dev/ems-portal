const prisma = require('../../config/prisma');
const { logActivity } = require('../../utils/activityLogger');
const { createNotification } = require('../../utils/notificationHelper');
const { validateCreateTask, validateTaskStatus, validateOverdueReason } = require('../../utils/validators/task.validator');

async function createTask(data, assignedBy, io) {
    validateCreateTask(data);

    const assignee = await prisma.user.findUnique({
        where: { id: Number(data.assignedTo) },
        include: { role: true }
    });

    if (!assignee) {
        throw new Error('Assigned user not found');
    }

    if (!assignee.isActive) {
        throw new Error('Cannot assign task to inactive user');
    }

    return prisma.$transaction(async (tx) => {
        const task = await tx.task.create({
            data: {
                title: data.title,
                description: data.description || null,
                assignedTo: Number(data.assignedTo),
                assignedBy,
                dueDate: new Date(data.dueDate),
                status: 'PENDING',
                leadId: data.leadId ? Number(data.leadId) : null
            },
            include: {
                assignedUser: { select: { id: true, name: true, email: true } },
                creator: { select: { id: true, name: true, email: true } },
                lead: { select: { id: true, name: true } }
            }
        });

        await Promise.all([
            logActivity(assignedBy, 'CREATE_TASK', 'Task', task.id, null, tx),
            createNotification(
                Number(data.assignedTo),
                'New Task Assigned',
                `You have been assigned a new task: "${task.title}". Due: ${new Date(task.dueDate).toLocaleDateString()}.`,
                'INFO',
                io,
                tx
            )
        ]);

        return task;
    });
}

async function getTasks(userId, role, query = {}) {
    const where = {};

    if (role === 'BDE' || role === 'TELESALES') {
        where.assignedTo = userId;
    }

    if (query.status) {
        where.status = query.status;
    }

    if (query.assignedTo && (role === 'SUPER_ADMIN' || role === 'HR')) {
        where.assignedTo = Number(query.assignedTo);
    }

    if (query.isOverdue === 'true') {
        where.isOverdue = true;
    }

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
        prisma.task.findMany({
            where,
            include: {
                assignedUser: { select: { id: true, name: true, email: true } },
                creator: { select: { id: true, name: true, email: true } },
                lead: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        }),
        prisma.task.count({ where })
    ]);

    const now = new Date();
    const updatedTasks = tasks.map(task => {
        if (task.status !== 'COMPLETED' && task.dueDate && new Date(task.dueDate) < now) {
            task.isOverdue = true;
        }
        return task;
    });

    return {
        tasks: updatedTasks,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

async function getTaskById(id, userId, role) {
    const task = await prisma.task.findUnique({
        where: { id: Number(id) },
        include: {
            assignedUser: { select: { id: true, name: true, email: true } },
            creator: { select: { id: true, name: true, email: true } },
            lead: { select: { id: true, name: true } }
        }
    });

    if (!task) {
        throw new Error('Task not found');
    }

    if ((role === 'BDE' || role === 'TELESALES') && task.assignedTo !== userId) {
        throw new Error('Access denied: Task not assigned to you');
    }

    return task;
}

async function updateTaskStatus(id, status, userId, role, io) {
    validateTaskStatus(status);

    const task = await prisma.task.findUnique({
        where: { id: Number(id) }
    });

    if (!task) {
        throw new Error('Task not found');
    }

    if ((role === 'BDE' || role === 'TELESALES') && task.assignedTo !== userId) {
        throw new Error('Access denied: Task not assigned to you');
    }

    const updateData = { status };

    if (status === 'COMPLETED') {
        updateData.completedAt = new Date();
        if (task.dueDate && new Date() > new Date(task.dueDate)) {
            updateData.isOverdue = true;
        }
    }

    return prisma.$transaction(async (tx) => {
        const updatedTask = await tx.task.update({
            where: { id: Number(id) },
            data: updateData,
            include: {
                assignedUser: { select: { id: true, name: true, email: true } },
                creator: { select: { id: true, name: true, email: true } },
                lead: { select: { id: true, name: true } }
            }
        });

        const promises = [];

        promises.push(logActivity(userId, 'UPDATE_TASK_STATUS', 'Task', updatedTask.id, null, tx));

        if (task.assignedBy !== userId) {
            promises.push(
                createNotification(
                    task.assignedBy,
                    'Task Status Updated',
                    `Task "${task.title}" has been marked as ${status}.`,
                    status === 'COMPLETED' ? 'SUCCESS' : 'INFO',
                    io,
                    tx
                )
            );
        }

        await Promise.all(promises);

        return updatedTask;
    });
}

async function submitOverdueReason(id, reason, userId, io) {
    validateOverdueReason(reason);

    const task = await prisma.task.findUnique({
        where: { id: Number(id) }
    });

    if (!task) {
        throw new Error('Task not found');
    }

    if (task.assignedTo !== userId) {
        throw new Error('Only the assigned user can submit overdue reason');
    }

    if (!task.isOverdue) {
        throw new Error('Task is not overdue');
    }

    return prisma.$transaction(async (tx) => {
        const updatedTask = await tx.task.update({
            where: { id: Number(id) },
            data: {
                reasonForDelay: reason,
                overdueReasonSubmitted: true
            },
            include: {
                assignedUser: { select: { id: true, name: true, email: true } },
                creator: { select: { id: true, name: true, email: true } }
            }
        });

        await Promise.all([
            logActivity(userId, 'SUBMIT_OVERDUE_REASON', 'Task', updatedTask.id, null, tx),
            createNotification(
                task.assignedBy,
                'Overdue Reason Submitted',
                `Overdue reason submitted for task "${task.title}": ${reason}`,
                'WARNING',
                io,
                tx
            )
        ]);

        return updatedTask;
    });
}

module.exports = {
    createTask,
    getTasks,
    getTaskById,
    updateTaskStatus,
    submitOverdueReason
};
