const followUpService = require('./followUp.service');

async function createFollowUp(req, res) {
    try {
        const io = req.app.get('io');
        const followUp = await followUpService.createFollowUp(
            req.body,
            req.user.userId,
            req.user.role,
            io
        );
        res.status(201).json({ success: true, data: followUp });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

async function getFollowUpsByLead(req, res) {
    try {
        const followUps = await followUpService.getFollowUpsByLead(
            req.params.leadId,
            req.user.userId,
            req.user.role
        );
        res.json({ success: true, data: followUps });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

async function getFollowUpById(req, res) {
    try {
        const followUp = await followUpService.getFollowUpById(
            req.params.id,
            req.user.userId,
            req.user.role
        );
        res.json({ success: true, data: followUp });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
}

async function getUpcomingFollowUps(req, res) {
    try {
        const followUps = await followUpService.getUpcomingFollowUps(
            req.user.userId,
            req.user.role
        );
        res.json({ success: true, data: followUps });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

async function getOverdueFollowUps(req, res) {
    try {
        const followUps = await followUpService.getOverdueFollowUps(
            req.user.userId,
            req.user.role
        );
        res.json({ success: true, data: followUps });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

module.exports = {
    createFollowUp,
    getFollowUpsByLead,
    getFollowUpById,
    getUpcomingFollowUps,
    getOverdueFollowUps
};
