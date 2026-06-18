const prisma = require('../../config/prisma');

async function getAnalytics() {
  const now = new Date();
  
  
  const users = await prisma.user.findMany({
    where: { role: { name: { in: ['BDE', 'TELESALES'] } } },
    select: { id: true, name: true }
  });
  
  const leads = await prisma.lead.findMany({
    select: { assignedTo: true, status: true, createdAt: true }
  });
  
  const followUps = await prisma.followUp.findMany({
    select: { createdBy: true, lead: { select: { status: true } } }
  });

  const leaderboard = users.map(user => {
    const userLeads = leads.filter(l => l.assignedTo === user.id);
    const converted = userLeads.filter(l => l.status === 'CONVERTED').length;
    
    const userFollowUps = followUps.filter(f => f.createdBy === user.id);
    const fuConverted = userFollowUps.filter(f => f.lead.status === 'CONVERTED').length;
    
    return {
      id: user.id,
      name: user.name,
      leads: userLeads.length,
      converted,
      conversionRate: userLeads.length ? Math.round((converted / userLeads.length) * 100) : 0,
      followUps: userFollowUps.length,
      fuConversions: fuConverted
    };
  }).sort((a, b) => b.conversionRate - a.conversionRate);

  
  const allUsers = await prisma.user.findMany({ select: { id: true, name: true } });
  const tasks = await prisma.task.findMany({
    select: { assignedTo: true, status: true, dueDate: true }
  });

  const taskPerformance = allUsers.map(user => {
    const userTasks = tasks.filter(t => t.assignedTo === user.id);
    const completed = userTasks.filter(t => t.status === 'COMPLETED').length;
    const overdue = userTasks.filter(t => t.status !== 'COMPLETED' && new Date(t.dueDate) < now).length;
    return {
      id: user.id,
      name: user.name,
      assigned: userTasks.length,
      completed,
      overdue
    };
  }).filter(t => t.assigned > 0).sort((a, b) => b.overdue - a.overdue);

  
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const attendance = await prisma.attendance.findMany({
    where: { date: { gte: startOfMonth } },
    select: { userId: true, checkIn: true }
  });

  const lateCheckins = {};
  attendance.forEach(record => {
    if (record.checkIn) {
      const checkInHour = new Date(record.checkIn).getHours();
      
      if (checkInHour >= 10) {
        lateCheckins[record.userId] = (lateCheckins[record.userId] || 0) + 1;
      }
    }
  });

  const attendanceInsights = allUsers
    .filter(u => lateCheckins[u.id])
    .map(u => ({
      name: u.name,
      lateDays: lateCheckins[u.id]
    }))
    .sort((a, b) => b.lateDays - a.lateDays);

  
  let ageUnder7 = 0;
  let age7to30 = 0;
  let ageOver30 = 0;
  
  leads.forEach(lead => {
    const ageDays = (now - new Date(lead.createdAt)) / (1000 * 60 * 60 * 24);
    if (ageDays < 7) ageUnder7++;
    else if (ageDays <= 30) age7to30++;
    else ageOver30++;
  });

  
  
  const totalLeads = leads.length || 1;
  const totalConverted = leads.filter(l => l.status === 'CONVERTED').length;
  const leadScore = Math.min((totalConverted / totalLeads) * 100 * 3, 100); 
  
  const totalTasks = tasks.length || 1;
  const taskCompleted = tasks.filter(t => t.status === 'COMPLETED').length;
  const taskScore = (taskCompleted / totalTasks) * 100;
  
  const healthScore = Math.round((leadScore * 0.6) + (taskScore * 0.4));

  return {
    leaderboard,
    taskPerformance,
    attendanceInsights,
    leadAging: {
      under7: ageUnder7,
      from7to30: age7to30,
      over30: ageOver30
    },
    healthScore
  };
}

module.exports = {
  getAnalytics
};
