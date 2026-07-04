const salesTargetService = require('./salesTarget.service');

async function setTarget(req, res) {
    try {
        const target = await salesTargetService.setTarget(req.body, req.user.userId);
        res.status(201).json({ success: true, data: target });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

async function getDashboardStats(req, res) {
    try {
        const month = parseInt(req.query.month) || new Date().getMonth() + 1;
        const year = parseInt(req.query.year) || new Date().getFullYear();
        const stats = await salesTargetService.getDashboardStats(req.user.userId, month, year);
        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

async function getLeaderboard(req, res) {
    try {
        const month = parseInt(req.query.month) || new Date().getMonth() + 1;
        const year = parseInt(req.query.year) || new Date().getFullYear();
        const leaderboard = await salesTargetService.getLeaderboard(month, year);
        res.json({ success: true, data: leaderboard });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

async function getAllTargets(req, res) {
    try {
        const month = parseInt(req.query.month) || new Date().getMonth() + 1;
        const year = parseInt(req.query.year) || new Date().getFullYear();
        const targets = await salesTargetService.getAllTargets(month, year);
        res.json({ success: true, data: targets });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

module.exports = {
    setTarget,
    getDashboardStats,
    getLeaderboard,
    getAllTargets
};
