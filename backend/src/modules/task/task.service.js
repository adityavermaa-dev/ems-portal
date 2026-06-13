const prisma = require('../../config/prisma');

async function createTask(data, assignedBy) {
    // Verify assignee exists and is active
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

    if (!data.dueDate) {
        throw new Error('Due date is mandatory');
    }

    const task = await prisma.task.create({
        data: {
            title: data.title,
            description: data.description || null,
            assignedTo: Number(data.assignedTo),
            assignedBy,
            dueDate: new Date(data.dueDate),
            status: 'PENDING'
        },
        include: {
            assignedUser: { select: { id: true, name: true, email: true } },
            creator: { select: { id: true, name: true, email: true } }
        }
    });

    return task;
}

async function getTasks(userId, role, query = {}) {
    const where = {};

    // BDE/TELESALES only see their assigned tasks
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
                creator: { select: { id: true, name: true, email: true } }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        }),
        prisma.task.count({ where })
    ]);

    // Check and mark overdue tasks
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
            creator: { select: { id: true, name: true, email: true } }
        }
    });

    if (!task) {
        throw new Error('Task not found');
    }

    // BDE/TELESALES can only see their assigned tasks
    if ((role === 'BDE' || role === 'TELESALES') && task.assignedTo !== userId) {
        throw new Error('Access denied: Task not assigned to you');
    }

    return task;
}

async function updateTaskStatus(id, status, userId, role) {
    const task = await prisma.task.findUnique({
        where: { id: Number(id) }
    });

    if (!task) {
        throw new Error('Task not found');
    }

    // BDE/TELESALES can only update their own tasks
    if ((role === 'BDE' || role === 'TELESALES') && task.assignedTo !== userId) {
        throw new Error('Access denied: Task not assigned to you');
    }

    const updateData = { status };

    if (status === 'COMPLETED') {
        updateData.completedAt = new Date();

        // Check if overdue
        if (task.dueDate && new Date() > new Date(task.dueDate)) {
            updateData.isOverdue = true;
        }
    }

    if (status === 'IN_PROGRESS' && task.status === 'PENDING') {
        // Valid transition
    }

    return prisma.task.update({
        where: { id: Number(id) },
        data: updateData,
        include: {
            assignedUser: { select: { id: true, name: true, email: true } },
            creator: { select: { id: true, name: true, email: true } }
        }
    });
}

async function submitOverdueReason(id, reason, userId) {
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

    return prisma.task.update({
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
}

module.exports = {
    createTask,
    getTasks,
    getTaskById,
    updateTaskStatus,
    submitOverdueReason
};
