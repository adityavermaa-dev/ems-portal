const prisma = require('../../config/prisma');
const { logActivity } = require('../../utils/activityLogger');
const { createNotification } = require('../../utils/notificationHelper');
const { validateCreateLead, validateLeadStatus } = require('../../utils/validators/lead.validator');
const fs = require('fs');
const csv = require('csv-parser');

async function createLead(data, createdBy) {
    validateCreateLead(data);

    
    const existingLead = await prisma.lead.findUnique({
        where: { phone: data.phone }
    });

    if (existingLead) {
        throw new Error("Phone number already exists");
    }

    return prisma.$transaction(async (tx) => {
        const lead = await tx.lead.create({
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

        await logActivity(createdBy, 'CREATE_LEAD', 'Lead', lead.id, null, tx);

        return lead;
    });
}

async function importLeads(filePath, createdBy) {
    const results = [];
    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                try {
                    let importedCount = 0;
                    for (const row of results) {
                        const name = row.name || row.Name;
                        const phone = String(row.phone || row.Phone || '').trim();
                        const email = row.email || row.Email || null;
                        const source = row.source || row.Source || null;
                        
                        if (!name || !phone) continue;
                        
                        const existingLead = await prisma.lead.findUnique({ where: { phone } });
                        if (!existingLead) {
                            await prisma.lead.create({
                                data: { name, phone, email, source, status: 'NEW', createdBy }
                            });
                            importedCount++;
                        }
                    }
                    fs.unlinkSync(filePath);
                    
                    if (importedCount > 0) {
                        await logActivity(createdBy, 'IMPORT_LEADS', 'Lead', null, `Imported ${importedCount} leads from CSV`);
                    }
                    resolve({ importedCount });
                } catch (err) {
                    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                    reject(err);
                }
            })
            .on('error', (err) => {
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                reject(err);
            });
    });
}

async function getLeads(userId, role, query = {}) {
    const where = {};

    if (role === 'BDE' || role === 'TELESALES') {
        where.assignedTo = userId;
    }

    if (query.status) {
        where.status = query.status;
    }

    if (query.assignedTo && (role === 'SUPER_ADMIN' || role === 'HR')) {
        where.assignedTo = Number(query.assignedTo);
    }

    const search = query.search?.trim();
    if (search) {
        where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search } },
            { email: { contains: search } }
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

    if ((role === 'BDE' || role === 'TELESALES') && lead.assignedTo !== userId) {
        throw new Error('Access denied: Lead not assigned to you');
    }

    if (data.phone && data.phone !== lead.phone) {
        const existingLead = await prisma.lead.findUnique({
            where: { phone: data.phone }
        });
        if (existingLead) {
            throw new Error("Phone number already exists");
        }
    }

    if (data.status && data.status !== lead.status) {
        validateLeadStatus(data.status, lead.status);
    }

    const updateData = {};
    if (data.name) updateData.name = data.name;
    if (data.phone) updateData.phone = data.phone;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.source !== undefined) updateData.source = data.source;
    if (data.status) updateData.status = data.status;

    return prisma.$transaction(async (tx) => {
        const updatedLead = await tx.lead.update({
            where: { id: Number(id) },
            data: updateData,
            include: {
                creator: { select: { id: true, name: true, email: true } },
                assignedUser: { select: { id: true, name: true, email: true } }
            }
        });

        await logActivity(userId, 'UPDATE_LEAD', 'Lead', updatedLead.id, null, tx);

        return updatedLead;
    });
}

async function assignLead(id, assignedTo, userId, io) {
    const existingLead = await prisma.lead.findUnique({
        where: { id: Number(id) }
    });

    if (!existingLead) {
        throw new Error("Lead not found");
    }

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

    return prisma.$transaction(async (tx) => {
        const lead = await tx.lead.update({
            where: { id: Number(id) },
            data: { 
                assignedTo: Number(assignedTo),
                assignedAt: new Date()
            },
            include: {
                creator: { select: { id: true, name: true, email: true } },
                assignedUser: { select: { id: true, name: true, email: true } }
            }
        });

        await Promise.all([
            logActivity(userId, 'ASSIGN_LEAD', 'Lead', lead.id, null, tx),
            createNotification(
                Number(assignedTo),
                'New Lead Assigned',
                `A new lead "${lead.name}" has been assigned to you.`,
                'INFO',
                io,
                tx
            )
        ]);

        return lead;
    });
}

async function updateLeadStatus(id, status, userId, role) {
    const lead = await prisma.lead.findUnique({ where: { id: Number(id) } });

    if (!lead) {
        throw new Error('Lead not found');
    }

    if ((role === 'BDE' || role === 'TELESALES') && lead.assignedTo !== userId) {
        throw new Error('Access denied: Lead not assigned to you');
    }

    if (status !== lead.status) {
        validateLeadStatus(status, lead.status);
    }

    return prisma.$transaction(async (tx) => {
        const updatedLead = await tx.lead.update({
            where: { id: Number(id) },
            data: { status },
            include: {
                creator: { select: { id: true, name: true, email: true } },
                assignedUser: { select: { id: true, name: true, email: true } }
            }
        });

        await logActivity(userId, 'UPDATE_LEAD_STATUS', 'Lead', updatedLead.id, null, tx);

        return updatedLead;
    });
}

module.exports = {
    createLead,
    importLeads,
    getLeads,
    getLeadById,
    updateLead,
    updateLeadStatus,
    assignLead
};
