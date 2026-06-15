import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "../services/api";
import { useAsync } from "../hooks/useAsync";
import { useForm } from "../hooks/useForm";
import { EMPLOYEE_ROLES, LEAD_STATUSES } from "../utils/constants";
import { titleCase, downloadCsv } from "../utils/helpers";
import { PanelHeader, Select, DataTable, Badge, RowActions, Modal, Loading, ErrorState } from "../components/ui";
import { Pagination } from "../components/Pagination";

export function Leads() {
  const { user, isAdmin, setNotice } = useOutletContext();
  const [filters, setFilters] = useState({ search: "", status: "", assignedTo: "" });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [assignTo, setAssignTo] = useState("");
  const [importing, setImporting] = useState(false);
  const [file, setFile] = useState(null);
  
  const { data, loading, error, refresh } = useAsync(() => api.leads({ ...filters, page, limit: 10 }), [filters.search, filters.status, filters.assignedTo, page]);
  const usersState = useAsync(() => isAdmin ? api.users() : Promise.resolve([]), [isAdmin]);
  const form = useForm({ name: "", phone: "", email: "", source: "" });
  
  const employeeUsers = (usersState.data || []).filter((item) => EMPLOYEE_ROLES.includes(item.role?.name || item.role) && item.isActive);

  async function createLead(event) {
    event.preventDefault();
    try {
      await api.createLead(form.values);
      setNotice("Lead created");
      form.reset();
      refresh();
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function updateStatus(lead, status) {
    try {
      await api.updateLeadStatus(lead.id, status);
      setNotice("Lead status updated");
      refresh();
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function assignLead(event) {
    event.preventDefault();
    await api.assignLead(selected.id, assignTo);
    setNotice("Lead assigned");
    setSelected(null);
    setAssignTo("");
    refresh();
  }

  async function importCsv(event) {
    event.preventDefault();
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.importLeads(formData);
      setNotice(`Successfully imported ${res.importedCount} leads`);
      setImporting(false);
      setFile(null);
      refresh();
    } catch (error) {
      setNotice(error.message);
    }
  }

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={refresh} />;

  const leads = data?.leads || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1 };

  return (
    <section className="stack">
      <PanelHeader title="Lead management" action={
        <RowActions>
          {isAdmin && <button onClick={() => setImporting(true)}>Import CSV</button>}
          {user.role === "SUPER_ADMIN" && <button onClick={() => downloadCsv("leads.csv", leads)}>Export CSV</button>}
        </RowActions>
      } />
      <div className="filters">
        <input placeholder="Search name, phone, email" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
        <Select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} options={["", ...LEAD_STATUSES]} placeholder="All statuses" />
        {isAdmin && <Select value={filters.assignedTo} onChange={(e) => setFilters({ ...filters, assignedTo: e.target.value })} options={["", ...employeeUsers.map((item) => item.id)]} labels={Object.fromEntries(employeeUsers.map((item) => [item.id, item.name]))} placeholder="All assignees" />}
      </div>
      {isAdmin && (
        <form className="form-grid" onSubmit={createLead}>
          <label>Name<input value={form.values.name} onChange={(e) => form.set("name", e.target.value)} required /></label>
          <label>Phone<input value={form.values.phone} onChange={(e) => form.set("phone", e.target.value)} required /></label>
          <label>Email<input type="email" value={form.values.email} onChange={(e) => form.set("email", e.target.value)} /></label>
          <label>Source<input value={form.values.source} onChange={(e) => form.set("source", e.target.value)} /></label>
          <button className="primary">Create lead</button>
        </form>
      )}
      <DataTable
        columns={["Lead", "Phone", "Status", "Assigned", "Follow-ups", "Actions"]}
        rows={leads.map((lead) => [
          <div key={lead.id}><strong>{lead.name}</strong><br/><small>{lead.email || lead.source || "No email/source"}</small></div>,
          lead.phone,
          <Badge tone={lead.status === "CONVERTED" ? "success" : lead.status === "NOT_INTERESTED" ? "danger" : "info"}>{titleCase(lead.status)}</Badge>,
          lead.assignedUser?.name || "Unassigned",
          lead._count?.followUps ?? lead.followUps?.length ?? 0,
          <RowActions>
            <Select value={lead.status} onChange={(e) => updateStatus(lead, e.target.value)} options={LEAD_STATUSES} />
            {isAdmin && <button onClick={() => setSelected(lead)}>Assign</button>}
          </RowActions>,
        ])}
      />
      <Pagination page={pagination.page} totalPages={pagination.totalPages} setPage={setPage} />
      {selected && (
        <Modal title={`Assign ${selected.name}`} onClose={() => setSelected(null)}>
          <form className="stack" onSubmit={assignLead}>
            <label>Employee<Select value={assignTo} onChange={(e) => setAssignTo(e.target.value)} options={employeeUsers.map((item) => item.id)} labels={Object.fromEntries(employeeUsers.map((item) => [item.id, `${item.name} (${titleCase(item.role?.name)})`]))} required /></label>
            <button className="primary">Assign lead</button>
          </form>
        </Modal>
      )}
      {importing && (
        <Modal title="Import Leads from CSV" onClose={() => { setImporting(false); setFile(null); }}>
          <form className="stack" onSubmit={importCsv}>
            <p className="muted">Upload a CSV file containing at least `name` and `phone` columns. Existing phone numbers will be skipped.</p>
            <label>CSV File<input type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} required /></label>
            <button className="primary">Upload and Import</button>
          </form>
        </Modal>
      )}
    </section>
  );
}
