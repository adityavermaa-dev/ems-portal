const activityLogService = require('./activityLog.service');

async function getActivityLogs(req, res) {
    try {
        const result = await activityLogService.getActivityLogs(req.query);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

async function getUserActivityLogs(req, res) {
    try {
        const result = await activityLogService.getUserActivityLogs(
            Number(req.params.userId),
            req.query
        );
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

async function getMyActivityLogs(req, res) {
    try {
        const result = await activityLogService.getMyActivityLogs(
            req.user.userId,
            req.query
        );
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

module.exports = {
    getActivityLogs,
    getUserActivityLogs,
    getMyActivityLogs
};
