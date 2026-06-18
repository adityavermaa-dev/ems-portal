const prisma = require('../../config/prisma');
const { logActivity } = require('../../utils/activityLogger');
const { createNotification } = require('../../utils/notificationHelper');
const { validateCreateFollowUp } = require('../../utils/validators/followUp.validator');

async function createFollowUp(data, userId, role, io) {
    validateCreateFollowUp(data);

    const lead = await prisma.lead.findUnique({
        where: { id: Number(data.leadId) }
    });

    if (!lead) {
        throw new Error('Lead not found');
    }

    if ((role === 'BDE' || role === 'TELESALES') && lead.assignedTo !== userId) {
        throw new Error('Access denied: Lead not assigned to you');
    }

    return prisma.$transaction(async (tx) => {
        const followUp = await tx.followUp.create({
            data: {
                leadId: Number(data.leadId),
                notes: data.notes,
                followUpDate: new Date(data.followUpDate),
                nextFollowUpDate: data.nextFollowUpDate ? new Date(data.nextFollowUpDate) : null,
                createdBy: userId
            },
            include: {
                lead: { select: { id: true, name: true, phone: true, status: true, assignedTo: true } },
                creator: { select: { id: true, name: true } }
            }
        });

        const promises = [];

        promises.push(logActivity(userId, 'CREATE_FOLLOW_UP', 'FollowUp', followUp.id, null, tx));

        const leadUpdateData = {};
        
        
        if (['NEW', 'INTERESTED'].includes(lead.status)) {
            leadUpdateData.status = 'FOLLOW_UP';
        }

        
        if (!lead.firstContactedAt) {
            leadUpdateData.firstContactedAt = new Date();
        }
        leadUpdateData.lastContactedAt = new Date();

        promises.push(
            tx.lead.update({
                where: { id: Number(data.leadId) },
                data: leadUpdateData
            })
        );

        if (lead.assignedTo && lead.assignedTo !== userId) {
            promises.push(
                createNotification(
                    lead.assignedTo,
                    'New Follow-Up Added',
                    `A follow-up was added for lead "${lead.name}".`,
                    'INFO',
                    io,
                    tx
                )
            );
        }

        await Promise.all(promises);

        return followUp;
    });
}

async function getFollowUpsByLead(leadId, userId, role) {
    const lead = await prisma.lead.findUnique({
        where: { id: Number(leadId) }
    });

    if (!lead) {
        throw new Error('Lead not found');
    }

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

async function getFollowUpById(id, userId, role) {
    const followUp = await prisma.followUp.findUnique({
        where: { id: Number(id) },
        include: {
            lead: {
                select: { id: true, name: true, phone: true, status: true, assignedTo: true },
            },
            creator: { select: { id: true, name: true } }
        }
    });

    if (!followUp) {
        throw new Error('Follow-up not found');
    }

    if ((role === 'BDE' || role === 'TELESALES') && followUp.lead.assignedTo !== userId) {
        throw new Error('Access denied: Lead not assigned to you');
    }

    return followUp;
}

async function getUpcomingFollowUps(userId, role) {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const where = {
        nextFollowUpDate: {
            gte: today,
            lte: nextWeek
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

async function getOverdueFollowUps(userId, role) {
    const where = {
        nextFollowUpDate: {
            lt: new Date()
        },
        lead: {
            status: { not: "CONVERTED" }
        }
    };

    if (role === 'BDE' || role === 'TELESALES') {
        where.lead.assignedTo = userId;
    }

    return prisma.followUp.findMany({
        where,
        include: {
            lead: {
                select: { id: true, name: true, phone: true, assignedTo: true, status: true }
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
    getUpcomingFollowUps,
    getOverdueFollowUps
};
