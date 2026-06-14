const taskService = require('./task.service');

async function createTask(req, res) {
    try {
        const io = req.app.get('io');
        const task = await taskService.createTask(
            req.body,
            req.user.userId,
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
        const io = req.app.get('io');
        const task = await taskService.updateTaskStatus(
            req.params.id,
            req.body.status,
            req.user.userId,
            req.user.role,
            io
        );
        res.json({ success: true, data: task });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

async function submitOverdueReason(req, res) {
    try {
        const io = req.app.get('io');
        const task = await taskService.submitOverdueReason(
            req.params.id,
            req.body.reason,
            req.user.userId,
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
