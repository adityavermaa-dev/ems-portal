import React from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAsync } from "../hooks/useAsync";
import { titleCase, countBy, downloadCsv } from "../utils/helpers";
import { LEAD_STATUSES, TASK_STATUSES } from "../utils/constants";
import { Loading, ErrorState, Metric, PanelHeader, FollowUpList } from "../components/ui";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts";

export function Dashboard() {
  const { user, isAdmin } = useOutletContext();
  const navigate = useNavigate();

  const { data, loading, error, refresh } = useAsync(async () => {
    const [leads, tasks, upcoming, overdue, attendance, notifications] = await Promise.all([
      api.leads({ limit: 100 }),
      api.tasks({ limit: 100 }),
      api.followUpsUpcoming(),
      api.followUpsOverdue(),
      isAdmin ? api.attendance({ limit: 100 }) : api.myAttendance({ limit: 100 }),
      api.unreadCount().catch(() => ({ unreadCount: 0 })),
    ]);
    let users = [];
    if (user.role === "SUPER_ADMIN") users = await api.users();
    return { leads, tasks, upcoming, overdue, attendance, notifications, users };
  }, [user.role, isAdmin]);

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={refresh} />;

  const leads = data.leads.leads || [];
  const tasks = data.tasks.tasks || [];
  const records = data.attendance.records || [];
  const userCounts = countBy(data.users, (item) => item.role?.name || item.role);
  const leadCounts = countBy(leads, (lead) => lead.status);
  const completedTasks = tasks.filter((task) => task.status === "COMPLETED").length;
  const insideOffice = records.filter((record) => record.isInsideOffice).length;

  const pieData = LEAD_STATUSES.map((status) => ({ name: titleCase(status), value: leadCounts[status] || 0 })).filter(d => d.value > 0);
  const barData = TASK_STATUSES.map((status) => ({ name: titleCase(status), Tasks: tasks.filter((task) => task.status === status).length }));
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <section className="stack">
      <div className="hero-band">
        <div>
          <p className="eyebrow">{titleCase(user.role)} dashboard</p>
          <h1>{user.name || "Welcome back"}</h1>
          <p>Track leads, follow-ups, attendance, team work, and operational signals from one place.</p>
        </div>
        <div className="quick-actions">
          <button onClick={() => navigate("/leads")}>Open leads</button>
          <button onClick={() => navigate("/tasks")}>Open tasks</button>
          <button onClick={() => navigate("/followups")}>Follow-ups</button>
        </div>
      </div>
      <div className="metric-grid">
        <Metric label="Total leads" value={leads.length} detail={`${leadCounts.CONVERTED || 0} converted`} />
        <Metric label="Active follow-ups" value={(data.upcoming || []).length} detail={`${(data.overdue || []).length} overdue`} tone="warning" />
        <Metric label="Assigned tasks" value={tasks.length} detail={`${completedTasks} completed`} tone="success" />
        <Metric label="Attendance logs" value={records.length} detail={`${insideOffice} inside office`} />
        {user.role === "SUPER_ADMIN" && <Metric label="Total users" value={data.users.length} detail={`${userCounts.HR || 0} HR, ${userCounts.BDE || 0} BDE`} />}
        <Metric label="Unread alerts" value={data.notifications.unreadCount || 0} detail="Notifications" tone="info" />
      </div>
      <div className="two-col" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div className="table-panel" style={{ padding: '24px', backgroundColor: 'var(--panel-bg)', borderRadius: '12px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '1rem' }}>Lead Status Distribution</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <RechartsTooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="muted">No lead data available</p>}
        </div>
        <div className="table-panel" style={{ padding: '24px', backgroundColor: 'var(--panel-bg)', borderRadius: '12px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '1rem' }}>Task Performance</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" fontSize={12} />
              <YAxis allowDecimals={false} fontSize={12} />
              <RechartsTooltip cursor={{ fill: 'transparent' }} />
              <Bar dataKey="Tasks" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="table-panel">
        <PanelHeader title="Follow-up reminders" action={<button onClick={() => downloadCsv("follow-ups.csv", [...data.upcoming, ...data.overdue])}>Export CSV</button>} />
        <FollowUpList rows={[...data.overdue, ...data.upcoming].slice(0, 8)} />
      </div>
    </section>
  );
}
