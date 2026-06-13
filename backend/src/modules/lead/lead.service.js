const prisma = require('../../config/prisma');

async function createLead(data, createdBy) {
    if (!data.name?.trim()) {
        throw new Error("Lead name is required");
    }

    if (!data.phone?.trim()) {
        throw new Error("Phone number is required");
    }

    const existingLead = await prisma.lead.findFirst({
        where: { phone: data.phone }
    });

    if (existingLead) {
        throw new Error("Lead already exists");
    }

    const lead = await prisma.lead.create({
        data: {
            name: data.name,
            phone: data.phone,
            email: data.email || null,
            source: data.source || null,
            status: 'NEW',
            createdBy
        },
        include: {
            creator: { include: { role: true } },
            assignedUser: { include: { role: true } }
        }
    });
    return lead;
}

async function getLeads(userId, role, query = {}) {
    const where = {};

    // BDE and TELESALES can only see their assigned leads
    if (role === 'BDE' || role === 'TELESALES') {
        where.assignedTo = userId;
    }

    // Filter by status if provided
    if (query.status) {
        where.status = query.status;
    }

    // Filter by assignedTo if provided (for admin/HR)
    if (query.assignedTo && (role === 'SUPER_ADMIN' || role === 'HR')) {
        where.assignedTo = Number(query.assignedTo);
    }

    // Search by name or phone
    if (query.search) {
        where.OR = [
            { name: { contains: query.search, mode: 'insensitive' } },
            { phone: { contains: query.search } },
            { email: { contains: query.search } }
        ];
    }

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const skip = (page - 1) * limit;

    const [leads, total] = await Promise.all([
        prisma.lead.findMany({
            where,
            include: {
                creator: { select: { id: true, name: true, email: true } },
                assignedUser: { select: { id: true, name: true, email: true } },
                _count: { select: { followUps: true } }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        }),
        prisma.lead.count({ where })
    ]);

    return {
        leads,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

async function getLeadById(id, userId, role) {
    const lead = await prisma.lead.findUnique({
        where: { id: Number(id) },
        include: {
            creator: { select: { id: true, name: true, email: true } },
            assignedUser: { select: { id: true, name: true, email: true } },
            followUps: {
                include: {
                    creator: { select: { id: true, name: true } }
                },
                orderBy: { createdAt: 'desc' }
            }
        }
    });

    if (!lead) {
        throw new Error('Lead not found');
    }

    // BDE/TELESALES can only view their assigned leads
    if ((role === 'BDE' || role === 'TELESALES') && lead.assignedTo !== userId) {
        throw new Error('Access denied: Lead not assigned to you');
    }

    return lead;
}

async function updateLead(id, data, userId, role) {
    const lead = await prisma.lead.findUnique({ where: { id: Number(id) } });

    if (!lead) {
        throw new Error('Lead not found');
    }

    // BDE/TELESALES can only update their assigned leads
    if ((role === 'BDE' || role === 'TELESALES') && lead.assignedTo !== userId) {
        throw new Error('Access denied: Lead not assigned to you');
    }

    const allowedStatuses = [
        "NEW",
        "INTERESTED",
        "NOT_INTERESTED",
        "FOLLOW_UP",
        "PAYMENT_PENDING",
        "CONVERTED"
    ];

    if (data.status && !allowedStatuses.includes(data.status)) {
        throw new Error("Invalid lead status");
    }

    if (lead.status === "CONVERTED") {
        throw new Error("Converted leads cannot be modified");
    }

    const updateData = {};

    if (data.name) updateData.name = data.name;
    if (data.phone) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.source !== undefined) updateData.source = data.source;
    if (data.status) updateData.status = data.status;

    return prisma.lead.update({
        where: { id: Number(id) },
        data: updateData,
        include: {
            creator: { select: { id: true, name: true, email: true } },
            assignedUser: { select: { id: true, name: true, email: true } }
        }
    });
}

async function assignLead(id, assignedTo) {
    const existingLead = await prisma.lead.findUnique({
        where: { id: Number(id) }
    });

    if (!existingLead) {
        throw new Error("Lead not found");
    }

    // Verify the assignee exists and has BDE or TELESALES role
    const assignee = await prisma.user.findUnique({
        where: { id: Number(assignedTo) },
        include: { role: true }
    });

    if (!assignee) {
        throw new Error('Assignee not found');
    }

    if (!['BDE', 'TELESALES'].includes(assignee.role.name)) {
        throw new Error('Leads can only be assigned to BDE or TELESALES users');
    }

    if (!assignee.isActive) {
        throw new Error('Cannot assign lead to inactive user');
    }

    const lead = await prisma.lead.update({
        where: { id: Number(id) },
        data: { assignedTo: Number(assignedTo) },
        include: {
            creator: { select: { id: true, name: true, email: true } },
            assignedUser: { select: { id: true, name: true, email: true } }
        }
    });

    return lead;
}

async function updateLeadStatus(id, status, userId, role) {
    const lead = await prisma.lead.findUnique({ where: { id: Number(id) } });

    if (!lead) {
        throw new Error('Lead not found');
    }

    if ((role === 'BDE' || role === 'TELESALES') && lead.assignedTo !== userId) {
        throw new Error('Access denied: Lead not assigned to you');
    }

    const allowedStatuses = [
        "NEW", "INTERESTED", "NOT_INTERESTED", "FOLLOW_UP", "PAYMENT_PENDING", "CONVERTED"
    ];

    if (!allowedStatuses.includes(status)) {
        throw new Error('Invalid lead status');
    }

    if (lead.status === 'CONVERTED') {
        throw new Error('Converted leads cannot be modified');
    }

    return prisma.lead.update({
        where: { id: Number(id) },
        data: { status },
        include: {
            creator: { select: { id: true, name: true, email: true } },
            assignedUser: { select: { id: true, name: true, email: true } }
        }
    });
}

module.exports = {
    createLead,
    getLeads,
    getLeadById,
    updateLead,
    updateLeadStatus,
    assignLead
};
