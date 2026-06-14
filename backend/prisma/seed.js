const prisma = require('../src/config/prisma');
const bcrypt = require('bcrypt');

async function main() {
  console.log('Seeding data...');

  // Roles
  const roles = ['SUPER_ADMIN', 'HR', 'BDE', 'TELESALES'];
  for (const roleName of roles) {
    await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName },
    });
  }

  const superAdminRole = await prisma.role.findUnique({ where: { name: 'SUPER_ADMIN' } });
  const hrRole = await prisma.role.findUnique({ where: { name: 'HR' } });
  const bdeRole = await prisma.role.findUnique({ where: { name: 'BDE' } });
  
  const passwordHash = await bcrypt.hash('password123', 10);

  // Users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@zustandtech.com' },
    update: {},
    create: { name: 'Admin User', email: 'admin@zustandtech.com', passwordHash, roleId: superAdminRole.id },
  });

  const hr = await prisma.user.upsert({
    where: { email: 'hr@zustandtech.com' },
    update: {},
    create: { name: 'HR User', email: 'hr@zustandtech.com', passwordHash, roleId: hrRole.id },
  });

  const bde1 = await prisma.user.upsert({
    where: { email: 'bde1@zustandtech.com' },
    update: {},
    create: { name: 'BDE One', email: 'bde1@zustandtech.com', passwordHash, roleId: bdeRole.id },
  });

  // Leads
  const lead1 = await prisma.lead.upsert({
    where: { phone: '1234567890' },
    update: {},
    create: { name: 'John Doe', email: 'john@example.com', phone: '1234567890', source: 'Website', status: 'NEW', createdBy: admin.id, assignedTo: bde1.id },
  });

  const lead2 = await prisma.lead.upsert({
    where: { phone: '0987654321' },
    update: {},
    create: { name: 'Jane Smith', email: 'jane@example.com', phone: '0987654321', source: 'Referral', status: 'INTERESTED', createdBy: hr.id, assignedTo: bde1.id },
  });

  // FollowUps
  await prisma.followUp.createMany({
    data: [
      { leadId: lead1.id, notes: 'First call, sent brochure.', followUpDate: new Date(), nextFollowUpDate: new Date(Date.now() + 86400000), createdBy: bde1.id },
      { leadId: lead2.id, notes: 'Interested in premium plan.', followUpDate: new Date(), nextFollowUpDate: new Date(Date.now() + 172800000), createdBy: bde1.id },
    ],
    skipDuplicates: true
  });

  // Tasks
  const task1 = await prisma.task.findFirst({ where: { title: 'Review weekly report' } });
  if (!task1) {
    await prisma.task.create({
      data: {
        title: 'Review weekly report',
        description: 'Check BDE performance',
        status: 'PENDING',
        assignedTo: hr.id,
        assignedBy: admin.id,
        dueDate: new Date(Date.now() + 86400000)
      }
    });
  }

  const task2 = await prisma.task.findFirst({ where: { title: 'Call Jane Smith' } });
  if (!task2) {
    await prisma.task.create({
      data: {
        title: 'Call Jane Smith',
        description: 'Discuss premium pricing',
        status: 'IN_PROGRESS',
        assignedTo: bde1.id,
        assignedBy: hr.id,
        dueDate: new Date(Date.now() - 86400000), // Overdue
        isOverdue: true
      }
    });
  }

  // Attendance
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  await prisma.attendance.upsert({
    where: { userId_date: { userId: bde1.id, date: startOfDay } },
    update: {},
    create: { userId: bde1.id, date: startOfDay, status: 'PRESENT', checkIn: new Date(), isInsideOffice: true }
  });

  // Messages
  const msg1 = await prisma.message.findFirst({ where: { content: 'Great job with Jane Smith!' } });
  if (!msg1) {
    await prisma.message.create({
      data: { senderId: admin.id, receiverId: bde1.id, content: 'Great job with Jane Smith!' }
    });
  }

  // Notifications
  const notif1 = await prisma.notification.findFirst({ where: { title: 'New Lead Assigned' } });
  if (!notif1) {
    await prisma.notification.create({
      data: { userId: bde1.id, title: 'New Lead Assigned', message: 'You have been assigned lead Jane Smith.', type: 'INFO' }
    });
  }

  // Activity Log
  const act1 = await prisma.activityLog.findFirst({ where: { action: 'CREATE', entityId: lead1.id } });
  if (!act1) {
    await prisma.activityLog.create({
      data: { userId: admin.id, action: 'CREATE', entityType: 'Lead', entityId: lead1.id, details: 'Created lead John Doe' }
    });
  }

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
