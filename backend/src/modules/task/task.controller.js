const taskService = require('./task.service');
const { logActivity } = require('../../utils/activityLogger');
const { createNotification } = require('../../utils/notificationHelper');

async function createTask(req, res) {
    try {
        const { title, description, assignedTo, dueDate } = req.body;

        if (!title || !assignedTo || !dueDate) {
            return res.status(400).json({
                success: false,
                message: 'title, assignedTo, and dueDate are required'
            });
        }

        const task = await taskService.createTask(
            { title, description, assignedTo, dueDate },
            req.user.userId
        );

        await logActivity(req.user.userId, 'CREATE_TASK', 'Task', task.id);

        // Notify the assignee
        const io = req.app.get('io');
        await createNotification(
            Number(assignedTo),
            'New Task Assigned',
            `You have been assigned a new task: "${title}". Due: ${new Date(dueDate).toLocaleDateString()}.`,
            'INFO',
            io
        );

        res.status(201).json({ success: true, data: task });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

async function getTasks(req, res) {
    try {
        const result = await taskService.getTasks(req.user.userId, req.user.role, req.query);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

async function getTaskById(req, res) {
    try {
        const task = await taskService.getTaskById(req.params.id, req.user.userId, req.user.role);
        res.json({ success: true, data: task });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
}

async function updateTaskStatus(req, res) {
    try {
        const { status } = req.body;

        if (!status || !['PENDING', 'IN_PROGRESS', 'COMPLETED'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Valid status required: PENDING, IN_PROGRESS, COMPLETED'
            });
        }

        const task = await taskService.updateTaskStatus(
            req.params.id,
            status,
            req.user.userId,
            req.user.role
        );

        await logActivity(req.user.userId, 'UPDATE_TASK_STATUS', 'Task', task.id);

        // Notify task creator when status changes
        if (task.assignedBy !== req.user.userId) {
            const io = req.app.get('io');
            await createNotification(
                task.assignedBy,
                'Task Status Updated',
                `Task "${task.title}" has been marked as ${status}.`,
                status === 'COMPLETED' ? 'SUCCESS' : 'INFO',
                io
            );
        }

        res.json({ success: true, data: task });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

async function submitOverdueReason(req, res) {
    try {
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({
                success: false,
                message: 'Reason for delay is required'
            });
        }

        const task = await taskService.submitOverdueReason(
            req.params.id,
            reason,
            req.user.userId
        );

        await logActivity(req.user.userId, 'SUBMIT_OVERDUE_REASON', 'Task', task.id);

        // Notify the task creator
        const io = req.app.get('io');
        await createNotification(
            task.assignedBy,
            'Overdue Reason Submitted',
            `Overdue reason submitted for task "${task.title}": ${reason}`,
            'WARNING',
            io
        );

        res.json({ success: true, data: task });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

module.exports = {
    createTask,
    getTasks,
    getTaskById,
    updateTaskStatus,
    submitOverdueReason
};
