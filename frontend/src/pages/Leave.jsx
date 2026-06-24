import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "../services/api";
import { useAsync } from "../hooks/useAsync";
import { useForm } from "../hooks/useForm";
import { toInputDate, formatDate } from "../utils/helpers";
import { PanelHeader, Select, EmptyState } from "../components/ui";

export function Leave() {
  const { user, isAdmin, setNotice } = useOutletContext();
  const [activeTab, setActiveTab] = useState(isAdmin ? "all" : "my");

  const myLeaves = useAsync(api.myLeaves, []);
  const allLeaves = useAsync(isAdmin ? api.leaves : () => Promise.resolve([]), [isAdmin]);

  const form = useForm({
    type: "CASUAL",
    startDate: toInputDate(new Date()),
    endDate: toInputDate(new Date()),
    reason: ""
  });

  async function submitLeave(e) {
    e.preventDefault();
    try {
      await api.createLeave(form.values);
      setNotice("Leave request submitted successfully");
      form.reset();
      myLeaves.refresh();
      if (isAdmin) allLeaves.refresh();
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function updateStatus(id, status) {
    try {
      await api.updateLeaveStatus(id, status);
      setNotice(`Leave ${status.toLowerCase()} successfully`);
      allLeaves.refresh();
    } catch (error) {
      setNotice(error.message);
    }
  }

  const renderTable = (rows, showReviewActions = false) => {
    if (!rows || rows.length === 0) return <EmptyState text="No leave requests found" />;
    return (
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {showReviewActions && <th>Employee</th>}
              <th>Type</th>
              <th>Date Range</th>
              <th>Reason</th>
              <th>Status</th>
              {showReviewActions && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {showReviewActions && (
                  <td>
                    <strong>{row.user?.name}</strong>
                    <small>{row.user?.role?.name}</small>
                  </td>
                )}
                <td>{row.type}</td>
                <td>
                  {formatDate(row.startDate)} - {formatDate(row.endDate)}
                </td>
                <td>{row.reason}</td>
                <td>
                  <span className={`badge ${row.status === 'APPROVED' ? 'success' : row.status === 'REJECTED' ? 'danger' : 'warning'}`}>
                    {row.status}
                  </span>
                  {row.reviewer && <small>Reviewed by {row.reviewer.name}</small>}
                </td>
                {showReviewActions && (
                  <td>
                    {row.status === "PENDING" && (
                      <div className="row-actions">
                        <button className="primary" onClick={() => updateStatus(row.id, "APPROVED")}>Approve</button>
                        <button className="secondary" onClick={() => updateStatus(row.id, "REJECTED")}>Reject</button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <section className="stack">
      <div className="hero-band">
        <div>
          <h1>Leave Management</h1>
          <p>Request time off or manage team leave requests.</p>
        </div>
        {isAdmin && (
          <div className="quick-actions">
            <button className={activeTab === "all" ? "primary" : ""} onClick={() => setActiveTab("all")}>All Requests</button>
            <button className={activeTab === "my" ? "primary" : ""} onClick={() => setActiveTab("my")}>My Requests</button>
          </div>
        )}
      </div>

      {activeTab === "my" && (
        <div className="two-col">
          <div className="table-panel">
            <PanelHeader title="Apply for Leave" />
            <form className="form-grid" onSubmit={submitLeave}>
              <label>
                Leave Type
                <Select
                  value={form.values.type}
                  onChange={(e) => form.set("type", e.target.value)}
                  options={["SICK", "CASUAL", "ANNUAL", "UNPAID"]}
                />
              </label>
              <label>
                Start Date
                <input
                  type="date"
                  value={form.values.startDate}
                  onChange={(e) => form.set("startDate", e.target.value)}
                  required
                />
              </label>
              <label>
                End Date
                <input
                  type="date"
                  value={form.values.endDate}
                  onChange={(e) => form.set("endDate", e.target.value)}
                  min={form.values.startDate}
                  required
                />
              </label>
              <label className="wide">
                Reason
                <textarea
                  value={form.values.reason}
                  onChange={(e) => form.set("reason", e.target.value)}
                  required
                />
              </label>
              <button className="primary">Submit Request</button>
            </form>
          </div>
          <div className="table-panel">
            <PanelHeader title="My Leave History" />
            {renderTable(myLeaves.data, false)}
          </div>
        </div>
      )}

      {activeTab === "all" && isAdmin && (
        <div className="table-panel">
          <PanelHeader title="Team Leave Requests" />
          {renderTable(allLeaves.data, true)}
        </div>
      )}
    </section>
  );
}
