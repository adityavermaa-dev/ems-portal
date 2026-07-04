import React, { useState, useEffect } from "react";
import { api } from "../services/api";
import { useAsync } from "../hooks/useAsync";
import { useForm } from "../hooks/useForm";
import { useOutletContext } from "react-router-dom";
import { PanelHeader, Select, EmptyState, Badge } from "../components/ui";

export function SalesTargets() {
  const { setNotice } = useOutletContext();
  
  const today = new Date();
  const [filters, setFilters] = useState({
    month: today.getMonth() + 1,
    year: today.getFullYear()
  });

  const targets = useAsync(() => api.salesTargets(filters), [filters.month, filters.year]);
  const usersReq = useAsync(() => api.users({ limit: 100 }), []);
  
  const bdes = (usersReq.data || []).filter(u => {
    const roleName = u.role?.name || u.role;
    return roleName === 'BDE' || roleName === 'TELESALES';
  });

  const form = useForm({
    userId: "",
    month: today.getMonth() + 1,
    year: today.getFullYear(),
    targetConversions: 20
  });

  async function submitTarget(e) {
    e.preventDefault();
    try {
      await api.setSalesTarget(form.values);
      setNotice("Target assigned successfully");
      form.reset({ ...form.values, userId: "", targetConversions: 20 });
      targets.refresh();
    } catch (error) {
      setNotice(error.message);
    }
  }

  const getProgressColor = (progress) => {
    if (progress < 30) return "danger";
    if (progress < 70) return "warning";
    if (progress < 100) return "success";
    return "info"; // Blue/Info for 100%+
  };

  const months = [
    { value: 1, label: "January" }, { value: 2, label: "February" },
    { value: 3, label: "March" }, { value: 4, label: "April" },
    { value: 5, label: "May" }, { value: 6, label: "June" },
    { value: 7, label: "July" }, { value: 8, label: "August" },
    { value: 9, label: "September" }, { value: 10, label: "October" },
    { value: 11, label: "November" }, { value: 12, label: "December" }
  ];

  const years = [today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1];

  return (
    <section className="stack">
      <div className="hero-band">
        <div>
          <h1>Sales Targets</h1>
          <p>Set and monitor monthly conversion targets for your sales team.</p>
        </div>
      </div>

      <div className="two-col">
        <div className="table-panel">
          <PanelHeader title="Assign Monthly Target" />
          <form className="form-grid" onSubmit={submitTarget}>
            <label className="wide">
              Employee
              <Select
                value={form.values.userId}
                onChange={(e) => form.set("userId", e.target.value)}
                options={["", ...bdes.map(u => u.id)]}
                labels={Object.fromEntries([["", "Select an employee..."], ...bdes.map(u => [u.id, `${u.name} (${u.role?.name || u.role})`])])}
                required
              />
            </label>
            <label>
              Month
              <Select
                value={form.values.month}
                onChange={(e) => form.set("month", e.target.value)}
                options={months.map(m => m.value)}
                labels={Object.fromEntries(months.map(m => [m.value, m.label]))}
              />
            </label>
            <label>
              Year
              <Select
                value={form.values.year}
                onChange={(e) => form.set("year", e.target.value)}
                options={years}
              />
            </label>
            <label className="wide">
              Target (Number of Conversions)
              <input
                type="number"
                min="1"
                value={form.values.targetConversions}
                onChange={(e) => form.set("targetConversions", e.target.value)}
                required
              />
            </label>
            <button className="primary">Assign Target</button>
          </form>
        </div>

        <div className="table-panel">
          <PanelHeader 
            title="Company Targets Dashboard" 
            action={
              <div style={{ display: 'flex', gap: '8px' }}>
                <Select
                  value={filters.month}
                  onChange={(e) => setFilters({ ...filters, month: Number(e.target.value) })}
                  options={months.map(m => m.value)}
                  labels={Object.fromEntries(months.map(m => [m.value, m.label.substring(0,3)]))}
                />
                <Select
                  value={filters.year}
                  onChange={(e) => setFilters({ ...filters, year: Number(e.target.value) })}
                  options={years}
                />
              </div>
            }
          />
          
          {!targets.data || targets.data.length === 0 ? (
            <EmptyState text={`No targets set for ${months.find(m => m.value === filters.month).label} ${filters.year}`} />
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Target</th>
                    <th>Converted</th>
                    <th>Remaining</th>
                    <th>Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {targets.data.map(row => (
                    <tr key={row.id}>
                      <td><strong>{row.user.name}</strong></td>
                      <td>{row.target}</td>
                      <td>{row.converted}</td>
                      <td>{row.remaining}</td>
                      <td>
                        <Badge tone={getProgressColor(row.progress)}>
                          {row.progress}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
