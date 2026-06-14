import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "../services/api";
import { useAsync } from "../hooks/useAsync";
import { useForm } from "../hooks/useForm";
import { EMPLOYEE_ROLES, TASK_STATUSES } from "../utils/constants";
import { titleCase, formatDate, downloadCsv } from "../utils/helpers";
import { PanelHeader, Select, DataTable, Badge, RowActions, Modal, Loading, ErrorState } from "../components/ui";
import { Pagination } from "../components/Pagination";

export function Tasks() {
  const { user, isAdmin, setNotice } = useOutletContext();
  const [filters, setFilters] = useState({ status: "", assignedTo: "", isOverdue: "" });
  const [page, setPage] = useState(1);
  const { data, loading, error, refresh } = useAsync(() => api.tasks({ ...filters, page, limit: 10 }), [filters.status, filters.assignedTo, filters.isOverdue, page]);
  const usersState = useAsync(() => isAdmin ? api.users() : Promise.resolve([]), [isAdmin]);
  const form = useForm({ title: "", description: "", assignedTo: "", dueDate: "" });
  const [reasonTask, setReasonTask] = useState(null);
  const [reason, setReason] = useState("");
  const employeeUsers = (usersState.data || []).filter((item) => item.isActive);

  async function createTask(event) {
    event.preventDefault();
    try {
      await api.createTask(form.values);
      setNotice("Task assigned");
      form.reset();
      refresh();
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function updateStatus(task, status) {
    await api.updateTaskStatus(task.id, status);
    setNotice("Task status updated");
    refresh();
  }

  async function submitReason(event) {
    event.preventDefault();
    await api.overdueReason(reasonTask.id, reason);
    setNotice("Overdue reason submitted");
    setReasonTask(null);
    setReason("");
    refresh();
  }

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={refresh} />;
  const tasks = data?.tasks || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1 };

  return (
    <section className="stack">
      <PanelHeader title="Task assignment" action={<button onClick={() => downloadCsv("tasks.csv", tasks)}>Export CSV</button>} />
      <div className="filters">
        <Select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} options={["", ...TASK_STATUSES]} placeholder="All statuses" />
        {isAdmin && <Select value={filters.assignedTo} onChange={(e) => setFilters({ ...filters, assignedTo: e.target.value })} options={["", ...employeeUsers.map((item) => item.id)]} labels={Object.fromEntries(employeeUsers.map((item) => [item.id, item.name]))} placeholder="All assignees" />}
        <Select value={filters.isOverdue} onChange={(e) => setFilters({ ...filters, isOverdue: e.target.value })} options={["", "true"]} labels={{ true: "Overdue only" }} placeholder="All due dates" />
      </div>
      {isAdmin && (
        <form className="form-grid" onSubmit={createTask}>
          <label>Title<input value={form.values.title} onChange={(e) => form.set("title", e.target.value)} required /></label>
          <label>Assignee<Select value={form.values.assignedTo} onChange={(e) => form.set("assignedTo", e.target.value)} options={employeeUsers.map((item) => item.id)} labels={Object.fromEntries(employeeUsers.map((item) => [item.id, `${item.name} (${titleCase(item.role?.name)})`]))} required /></label>
          <label>Due date<input type="datetime-local" value={form.values.dueDate} onChange={(e) => form.set("dueDate", e.target.value)} required /></label>
          <label className="wide">Description<textarea value={form.values.description} onChange={(e) => form.set("description", e.target.value)} /></label>
          <button className="primary">Assign task</button>
        </form>
      )}
      <DataTable
        columns={["Task", "Assignee", "Due", "Status", "Delay", "Actions"]}
        rows={tasks.map((task) => [
          <div key={task.id}><strong>{task.title}</strong><br/><small>{task.description || "No description"}</small></div>,
          task.assignedUser?.name || "-",
          formatDate(task.dueDate, true),
          <Badge tone={task.status === "COMPLETED" ? "success" : task.isOverdue ? "danger" : "info"}>{titleCase(task.status)}</Badge>,
          task.reasonForDelay || (task.isOverdue ? "Required" : "-"),
          <RowActions>
            <Select value={task.status} onChange={(e) => updateStatus(task, e.target.value)} options={TASK_STATUSES} />
            {EMPLOYEE_ROLES.includes(user.role) && task.isOverdue && !task.overdueReasonSubmitted && <button onClick={() => setReasonTask(task)}>Delay reason</button>}
          </RowActions>,
        ])}
      />
      <Pagination page={pagination.page} totalPages={pagination.totalPages} setPage={setPage} />
      {reasonTask && (
        <Modal title={`Overdue reason: ${reasonTask.title}`} onClose={() => setReasonTask(null)}>
          <form className="stack" onSubmit={submitReason}>
            <label>Reason<textarea value={reason} onChange={(e) => setReason(e.target.value)} required /></label>
            <button className="primary">Submit reason</button>
          </form>
        </Modal>
      )}
    </section>
  );
}
