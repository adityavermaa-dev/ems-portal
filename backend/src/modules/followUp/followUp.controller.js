const followUpService = require('./followUp.service');
const { logActivity } = require('../../utils/activityLogger');
const { createNotification } = require('../../utils/notificationHelper');

async function createFollowUp(req, res) {
    try {
        const { leadId, notes, followUpDate, nextFollowUpDate } = req.body;

        if (!leadId || !notes || !followUpDate) {
            return res.status(400).json({
                success: false,
                message: 'leadId, notes, and followUpDate are required'
            });
        }

        const followUp = await followUpService.createFollowUp(
            { leadId, notes, followUpDate, nextFollowUpDate },
            req.user.userId,
            req.user.role
        );

        await logActivity(req.user.userId, 'CREATE_FOLLOW_UP', 'FollowUp', followUp.id);

        // Notify lead creator if different from follow-up creator
        if (followUp.lead && followUp.lead.assignedTo && followUp.lead.assignedTo !== req.user.userId) {
            const io = req.app.get('io');
            await createNotification(
                followUp.lead.assignedTo,
                'New Follow-Up Added',
                `A follow-up was added for lead "${followUp.lead.name}".`,
                'INFO',
                io
            );
        }

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
        const followUp = await followUpService.getFollowUpById(req.params.id);
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

module.exports = {
    createFollowUp,
    getFollowUpsByLead,
    getFollowUpById,
    getUpcomingFollowUps
};
