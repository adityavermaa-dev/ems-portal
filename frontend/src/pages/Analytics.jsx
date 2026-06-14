import React from "react";
import { useAsync } from "../hooks/useAsync";
import { api } from "../services/api";
import { Loading, ErrorState, Metric, DataTable, PanelHeader } from "../components/ui";
import { Activity, Users, AlertTriangle, Briefcase, Clock, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from "recharts";

export default function Analytics() {
  const { data, loading, error, refresh } = useAsync(async () => {
    return await api.analytics();
  }, []);

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={refresh} />;

  const { leaderboard, taskPerformance, attendanceInsights, leadAging, healthScore } = data;

  // Format Leaderboard
  const leaderColumns = ["Employee", "Total Leads", "Converted", "Conversion Rate", "Follow-ups", "FU Conversions"];
  const leaderRows = leaderboard.map(row => [
    <strong key={row.id}>{row.name}</strong>,
    row.leads,
    row.converted,
    <span key={row.id} style={{ color: row.conversionRate >= 30 ? '#10b981' : (row.conversionRate < 10 ? '#ef4444' : 'inherit') }}>
      {row.conversionRate}%
    </span>,
    row.followUps,
    row.fuConversions
  ]);

  // Format Tasks
  const taskColumns = ["Employee", "Assigned", "Completed", "Overdue"];
  const taskRows = taskPerformance.map(row => [
    <strong key={row.id}>{row.name}</strong>,
    row.assigned,
    row.completed,
    <span key={row.id} style={{ color: row.overdue > 0 ? '#ef4444' : 'inherit' }}>
      {row.overdue > 0 ? `🔴 ${row.overdue}` : '0'}
    </span>
  ]);

  // Format Attendance
  const attColumns = ["Employee", "Late Check-ins (This Month)"];
  const attRows = attendanceInsights.map(row => [
    <strong key={row.name}>{row.name}</strong>,
    <span key={row.name} style={{ color: '#f59e0b', fontWeight: 'bold' }}>{row.lateDays}</span>
  ]);

  // Aging Chart Data
  const agingData = [
    { name: "< 7 Days", count: leadAging.under7, color: '#10b981' },
    { name: "7 - 30 Days", count: leadAging.from7to30, color: '#f59e0b' },
    { name: "> 30 Days (Stale)", count: leadAging.over30, color: '#ef4444' }
  ];

  let healthTone = "danger";
  if (healthScore >= 70) healthTone = "success";
  else if (healthScore >= 40) healthTone = "warning";

  return (
    <section className="stack">
      <div className="hero-band" style={{ padding: "20px 24px", alignItems: "center" }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Activity size={28} /> Performance Analytics
          </h1>
          <p>Turn data into insights. Monitor employee productivity and company health.</p>
        </div>
        <div>
          <Metric 
            label="Business Health Score" 
            value={`${healthScore} / 100`} 
            detail="Aggregated from conversions & tasks" 
            tone={healthTone} 
          />
        </div>
      </div>

      <div className="two-col">
        <div className="stack">
          <PanelHeader title="Employee Leaderboard & Conversions" action={<Users size={20} color="#53636e"/>} />
          <DataTable columns={leaderColumns} rows={leaderRows} />
        </div>
        <div className="table-panel" style={{ padding: '24px', backgroundColor: 'var(--panel-bg)', borderRadius: '12px' }}>
          <h3 style={{ marginBottom: '16px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrendingUp size={18} /> Lead Aging
          </h3>
          <p className="muted" style={{ marginBottom: '16px', fontSize: '0.85rem' }}>Managers hate old leads. Distribute them to keep the pipeline fresh.</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={agingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="name" fontSize={11} />
              <YAxis allowDecimals={false} fontSize={11} />
              <RechartsTooltip cursor={{ fill: 'transparent' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {agingData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="two-col">
        <div className="stack">
          <PanelHeader title="Task Productivity Bottlenecks" action={<Briefcase size={20} color="#53636e"/>} />
          <DataTable columns={taskColumns} rows={taskRows} />
        </div>
        <div className="stack">
          <PanelHeader title="Attendance Insights" action={<Clock size={20} color="#53636e"/>} />
          <DataTable columns={attColumns} rows={attRows} />
        </div>
      </div>
    </section>
  );
}
