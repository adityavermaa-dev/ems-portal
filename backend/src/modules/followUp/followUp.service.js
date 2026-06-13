const prisma = require('../../config/prisma');

async function createFollowUp(data, userId, role) {
    // Verify the lead exists
    const lead = await prisma.lead.findUnique({
        where: { id: Number(data.leadId) }
    });

    if (!lead) {
        throw new Error('Lead not found');
    }

    // BDE/TELESALES can only add follow-ups for their assigned leads
    if ((role === 'BDE' || role === 'TELESALES') && lead.assignedTo !== userId) {
        throw new Error('Access denied: Lead not assigned to you');
    }

    // Create follow-up
    const followUp = await prisma.followUp.create({
        data: {
            leadId: Number(data.leadId),
            notes: data.notes,
            followUpDate: new Date(data.followUpDate),
            nextFollowUpDate: data.nextFollowUpDate ? new Date(data.nextFollowUpDate) : null,
            createdBy: userId
        },
        include: {
            lead: { select: { id: true, name: true, phone: true, status: true } },
            creator: { select: { id: true, name: true } }
        }
    });

    // Auto-update lead status to FOLLOW_UP if it's currently NEW or INTERESTED
    if (['NEW', 'INTERESTED'].includes(lead.status)) {
        await prisma.lead.update({
            where: { id: Number(data.leadId) },
            data: { status: 'FOLLOW_UP' }
        });
    }

    return followUp;
}

async function getFollowUpsByLead(leadId, userId, role) {
    const lead = await prisma.lead.findUnique({
        where: { id: Number(leadId) }
    });

    if (!lead) {
        throw new Error('Lead not found');
    }

    // BDE/TELESALES can only view follow-ups for their assigned leads
    if ((role === 'BDE' || role === 'TELESALES') && lead.assignedTo !== userId) {
        throw new Error('Access denied: Lead not assigned to you');
    }

    return prisma.followUp.findMany({
        where: { leadId: Number(leadId) },
        include: {
            creator: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' }
    });
}

async function getFollowUpById(id) {
    const followUp = await prisma.followUp.findUnique({
        where: { id: Number(id) },
        include: {
            lead: {
                select: { id: true, name: true, phone: true, status: true },
            },
            creator: { select: { id: true, name: true } }
        }
    });

    if (!followUp) {
        throw new Error('Follow-up not found');
    }

    return followUp;
}

async function getUpcomingFollowUps(userId, role) {
    const where = {
        nextFollowUpDate: {
            gte: new Date()
        }
    };

    if (role === 'BDE' || role === 'TELESALES') {
        where.lead = { assignedTo: userId };
    }

    return prisma.followUp.findMany({
        where,
        include: {
            lead: {
                select: { id: true, name: true, phone: true, assignedTo: true }
            },
            creator: { select: { id: true, name: true } }
        },
        orderBy: { nextFollowUpDate: 'asc' },
        take: 50
    });
}

module.exports = {
    createFollowUp,
    getFollowUpsByLead,
    getFollowUpById,
    getUpcomingFollowUps
};
