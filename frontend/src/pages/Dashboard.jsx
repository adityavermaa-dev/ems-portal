import React from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useAsync } from "../hooks/useAsync";
import { titleCase, countBy, downloadCsv, formatDate } from "../utils/helpers";
import { LEAD_STATUSES, TASK_STATUSES } from "../utils/constants";
import { Loading, ErrorState, Metric, PanelHeader, FollowUpList, EmptyState } from "../components/ui";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts";
import { Users, UserCheck, PhoneCall, TrendingUp, AlertCircle, CheckCircle, Clock, Calendar, Bell } from "lucide-react";

export function Dashboard() {
  const { user, isAdmin } = useOutletContext();
  const navigate = useNavigate();

  const { data, loading, error, refresh } = useAsync(async () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Base requests for everyone
    const [leads, tasks, upcoming, overdue, attendance, notifications, activityLog] = await Promise.all([
      api.leads({ limit: 100 }),
      api.tasks({ limit: 100 }),
      api.followUpsUpcoming(),
      api.followUpsOverdue(),
      isAdmin ? api.attendance({ limit: 100 }) : api.myAttendance({ limit: 100 }),
      api.unreadCount().catch(() => ({ unreadCount: 0 })),
      api.activityLogs(isAdmin ? "/api/activity-logs" : "/api/activity-logs/my", { limit: 5 })
    ]);
    
    let users = [];
    if (user.role === "SUPER_ADMIN") users = await api.users();
    
    return { leads, tasks, upcoming, overdue, attendance, notifications, activityLog, users };
  }, [user.role, isAdmin]);

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={refresh} />;

  const leads = data.leads.leads || [];
  const tasks = data.tasks.tasks || [];
  const records = data.attendance.records || [];
  const logs = data.activityLog.logs || [];
  
  const leadCounts = countBy(leads, (lead) => lead.status);
  
  // Task Metrics
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const overdueTasks = tasks.filter((t) => t.status !== "COMPLETED" && new Date(t.dueDate) < now).length;
  const dueTodayTasks = tasks.filter((t) => t.status !== "COMPLETED" && t.dueDate && t.dueDate.startsWith(todayStr)).length;
  const completedTodayTasks = tasks.filter((t) => t.status === "COMPLETED" && t.updatedAt && t.updatedAt.startsWith(todayStr)).length;

  // HR Metrics
  const insideOffice = records.filter((r) => r.isInsideOffice).length;
  const presentToday = records.filter((r) => r.date?.startsWith(todayStr) || r.createdAt?.startsWith(todayStr)).length;

  // Chart Data
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
        {user.role === "SUPER_ADMIN" && (
          <>
            <Metric label="Total users" value={data.users.length} icon={Users} />
            <Metric label="Total leads" value={leads.length} detail={`${leadCounts.CONVERTED || 0} converted`} icon={TrendingUp} />
            <Metric label="Attendance logs" value={records.length} detail={`${insideOffice} inside office`} icon={UserCheck} />
          </>
        )}

        {user.role === "HR" && (
          <>
            <Metric label="Present Today" value={presentToday} icon={UserCheck} tone="success" />
            <Metric label="Outside Office" value={records.length - insideOffice} icon={Clock} tone="warning" />
            <Metric label="Total logs" value={records.length} icon={Calendar} />
          </>
        )}

        {user.role === "BDE" && (
          <>
            <Metric label="Assigned Leads" value={leads.length} icon={Users} />
            <Metric label="Today's Follow-Ups" value={data.upcoming.length} icon={Calendar} tone="info" />
            <Metric label="Conversions" value={leadCounts.CONVERTED || 0} icon={TrendingUp} tone="success" />
          </>
        )}

        {user.role === "TELESALES" && (
          <>
            <Metric label="Total Calls" value={leads.length} detail="Assigned" icon={PhoneCall} />
            <Metric label="Today's Follow-Ups" value={data.upcoming.length} icon={Calendar} tone="info" />
            <Metric label="Interested" value={leadCounts.INTERESTED || 0} icon={TrendingUp} tone="success" />
          </>
        )}

        <Metric label="Overdue Tasks" value={overdueTasks} icon={AlertCircle} tone="danger" />
        <Metric label="Due Today" value={dueTodayTasks} icon={Clock} tone="warning" />
        <Metric label="Completed Today" value={completedTodayTasks} icon={CheckCircle} tone="success" />
        <Metric label="Unread alerts" value={data.notifications.unreadCount || 0} icon={Bell} tone="info" />
      </div>

      {(isAdmin || user.role === "BDE") && (
        <div className="two-col">
          <div className="table-panel" style={{ padding: '24px', backgroundColor: 'var(--panel-bg)', borderRadius: '12px' }}>
            <h3 style={{ marginBottom: '16px', fontSize: '1rem' }}>Lead Status Distribution</h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={80} outerRadius={130} paddingAngle={5} dataKey="value">
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
            <ResponsiveContainer width="100%" height={400}>
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
      )}

      <div className="two-col">
        <div className="table-panel">
          <PanelHeader title="Follow-up reminders" action={<button onClick={() => downloadCsv("follow-ups.csv", [...data.upcoming, ...data.overdue])}>Export CSV</button>} />
          <FollowUpList rows={[...data.overdue, ...data.upcoming].slice(0, 8)} />
        </div>
        
        <div className="table-panel">
          <PanelHeader title="Recent Activity" />
          <div className="list">
            {logs.length > 0 ? logs.map(log => (
              <article key={log.id}>
                <div>
                  <strong>{log.action}</strong>
                  <small>{log.details || `${titleCase(log.entityType)} #${log.entityId}`}</small>
                </div>
                <span>{formatDate(log.createdAt, true)}</span>
              </article>
            )) : <EmptyState text="No recent activity" />}
          </div>
        </div>
      </div>
    </section>
  );
}
