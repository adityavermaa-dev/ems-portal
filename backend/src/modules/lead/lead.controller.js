const leadService = require('./lead.service');
const { logActivity } = require('../../utils/activityLogger');
const { createNotification } = require('../../utils/notificationHelper');

async function createLead(req, res) {
    try {
        const { name, phone, email, source } = req.body;

        if (!name || !phone) {
            return res.status(400).json({ success: false, message: 'Name and phone are required' });
        }

        const lead = await leadService.createLead({ name, phone, email, source }, req.user.userId);

        await logActivity(req.user.userId, 'CREATE_LEAD', 'Lead', lead.id);

        res.status(201).json({ success: true, data: lead });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

async function getLeads(req, res) {
    try {
        const result = await leadService.getLeads(req.user.userId, req.user.role, req.query);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

async function getLeadById(req, res) {
    try {
        const lead = await leadService.getLeadById(req.params.id, req.user.userId, req.user.role);
        res.json({ success: true, data: lead });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
}

async function updateLead(req, res) {
    try {
        const lead = await leadService.updateLead(req.params.id, req.body, req.user.userId, req.user.role);

        await logActivity(req.user.userId, 'UPDATE_LEAD', 'Lead', lead.id);

        res.json({ success: true, data: lead });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

async function assignLead(req, res) {
    try {
        const { assignedTo } = req.body;

        if (!assignedTo) {
            return res.status(400).json({ success: false, message: 'assignedTo is required' });
        }

        const lead = await leadService.assignLead(req.params.id, assignedTo);

        await logActivity(req.user.userId, 'ASSIGN_LEAD', 'Lead', lead.id);

        // Notify the assignee
        const io = req.app.get('io');
        await createNotification(
            Number(assignedTo),
            'New Lead Assigned',
            `A new lead "${lead.name}" has been assigned to you.`,
            'INFO',
            io
        );

        res.json({ success: true, data: lead });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

async function updateLeadStatus(req, res) {
    try {
        const { status } = req.body;
        if (!status) {
            return res.status(400).json({ success: false, message: 'Status is required' });
        }

        const lead = await leadService.updateLeadStatus(req.params.id, status, req.user.userId, req.user.role);

        await logActivity(req.user.userId, 'UPDATE_LEAD_STATUS', 'Lead', lead.id);

        res.json({ success: true, data: lead });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

module.exports = {
    createLead,
    getLeads,
    getLeadById,
    updateLead,
    updateLeadStatus,
    assignLead
};
