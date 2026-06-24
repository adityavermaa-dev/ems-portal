const leaveService = require('./leave.service');

async function createLeaveRequest(req, res) {
    try {
        const io = req.app.get('io');
        const leave = await leaveService.createLeaveRequest(
            req.body,
            req.user.userId,
            io
        );
        res.status(201).json({ success: true, data: leave });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

async function getMyLeaveRequests(req, res) {
    try {
        const leaves = await leaveService.getMyLeaveRequests(req.user.userId);
        res.json({ success: true, data: leaves });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

async function getAllLeaveRequests(req, res) {
    try {
        const leaves = await leaveService.getAllLeaveRequests();
        res.json({ success: true, data: leaves });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

async function updateLeaveStatus(req, res) {
    try {
        const io = req.app.get('io');
        const leave = await leaveService.updateLeaveStatus(
            req.params.id,
            req.body.status,
            req.user.userId,
            io
        );
        res.json({ success: true, data: leave });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

module.exports = {
    createLeaveRequest,
    getMyLeaveRequests,
    getAllLeaveRequests,
    updateLeaveStatus
};
