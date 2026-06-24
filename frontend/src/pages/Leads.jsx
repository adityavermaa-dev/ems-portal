import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "../services/api";
import { useAsync } from "../hooks/useAsync";
import { useForm } from "../hooks/useForm";
import { EMPLOYEE_ROLES, LEAD_STATUSES } from "../utils/constants";
import { titleCase, downloadCsv } from "../utils/helpers";
import { PanelHeader, Select, DataTable, Badge, RowActions, Modal, Loading, ErrorState } from "../components/ui";
import { Pagination } from "../components/Pagination";
import { Phone, Mail, MessageCircle } from "lucide-react";

export function Leads() {
  const { user, isAdmin, isHR, setNotice } = useOutletContext();
  const [filters, setFilters] = useState({ search: "", status: "", assignedTo: "" });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [assignTo, setAssignTo] = useState("");
  const [viewingLead, setViewingLead] = useState(null);
  const [noteContent, setNoteContent] = useState("");
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

  async function loadLeadDetails(lead) {
    try {
      const fullLead = await api.getLeadById(lead.id);
      setViewingLead(fullLead);
    } catch (err) {
      setNotice("Failed to load lead details");
    }
  }

  async function handleAddNote(e) {
    e.preventDefault();
    try {
      await api.createLeadNote(viewingLead.id, { content: noteContent });
      setNoteContent("");
      await loadLeadDetails(viewingLead); // refresh details
      setNotice("Note added");
    } catch (err) {
      setNotice(err.message);
    }
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
        <input placeholder="Search name, phone, email" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })} />
        {isAdmin && <Select value={filters.assignedTo} onChange={(e) => setFilters({ ...filters, assignedTo: e.target.value, page: 1 })} options={["", ...employeeUsers.map((item) => item.id)]} labels={Object.fromEntries(employeeUsers.map((item) => [item.id, item.name]))} placeholder="All assignees" />}
      </div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {[
          { label: "All", value: "" },
          { label: "New", value: "NEW" },
          { label: "Interested", value: "INTERESTED" },
          { label: "Not Interested", value: "NOT_INTERESTED" },
          { label: "Others", value: "OTHERS" }
        ].map(tab => (
          <button 
            key={tab.label} 
            className={filters.status === tab.value ? "primary" : "secondary"} 
            onClick={() => setFilters({ ...filters, status: tab.value, page: 1 })}
          >
            {tab.label}
          </button>
        ))}
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
        columns={["Lead", "Email", "Phone", "Source", "Status", "Assigned", "Follow-ups", "Actions"]}
        rows={leads.map((lead) => [
          <div key={lead.id}>
            <strong style={{ cursor: 'pointer', color: 'var(--accent)' }} onClick={() => loadLeadDetails(lead)}>{lead.name}</strong>
          </div>,
          lead.email ? (
            <a href={`mailto:${lead.email}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
              <Mail size={12} /> {lead.email}
            </a>
          ) : "-",
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <a href={`tel:${lead.phone}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }} title="Call">
              <Phone size={14} /> {lead.phone}
            </a>
            <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', color: '#25D366' }} title="WhatsApp">
              <MessageCircle size={16} />
            </a>
          </div>,
          lead.source || "-",
          <Badge tone={lead.status === "CONVERTED" ? "success" : lead.status === "NOT_INTERESTED" ? "danger" : "info"}>{titleCase(lead.status)}</Badge>,
          lead.assignedUser?.name || "Unassigned",
          lead._count?.followUps ?? lead.followUps?.length ?? 0,
          <RowActions>
            <button onClick={() => loadLeadDetails(lead)}>Details</button>
            <Select value={lead.status} onChange={(e) => updateStatus(lead, e.target.value)} options={LEAD_STATUSES} />
            {isHR && <button onClick={() => setSelected(lead)}>Assign</button>}
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
      {viewingLead && (
        <Modal title={`Lead Details: ${viewingLead.name}`} onClose={() => { setViewingLead(null); refresh(); }}>
          <div className="stack" style={{ gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: 'var(--panel-bg)', padding: '16px', borderRadius: '8px' }}>
              <div><strong>Phone:</strong> <a href={`tel:${viewingLead.phone}`}>{viewingLead.phone}</a></div>
              <div><strong>Email:</strong> {viewingLead.email ? <a href={`mailto:${viewingLead.email}`}>{viewingLead.email}</a> : "-"}</div>
              <div><strong>Status:</strong> <Badge>{viewingLead.status}</Badge></div>
              <div><strong>Assigned:</strong> {viewingLead.assignedUser?.name || "Unassigned"}</div>
            </div>

            {viewingLead.tasks && viewingLead.tasks.length > 0 && (
              <div>
                <h4 style={{ marginBottom: '8px' }}>Active Tasks</h4>
                <div className="list">
                  {viewingLead.tasks.map(t => (
                    <article key={t.id} style={{ background: 'var(--bg)', padding: '12px', borderRadius: '6px' }}>
                      <strong>{t.title}</strong> - <Badge>{t.status}</Badge><br/>
                      <small>Due: {new Date(t.dueDate).toLocaleString()}</small>
                    </article>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 style={{ marginBottom: '8px' }}>Interaction Notes</h4>
              <div className="list" style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '16px' }}>
                {viewingLead.notes?.map(note => (
                  <article key={note.id} style={{ background: 'var(--bg)', padding: '12px', borderRadius: '6px' }}>
                    <small style={{ color: 'var(--muted)' }}>{new Date(note.createdAt).toLocaleString()} by {note.creator?.name}</small>
                    <p style={{ marginTop: '4px' }}>{note.content}</p>
                  </article>
                ))}
                {(!viewingLead.notes || viewingLead.notes.length === 0) && <p className="muted">No notes yet.</p>}
              </div>

              <form onSubmit={handleAddNote} style={{ display: 'flex', gap: '8px' }}>
                <input type="text" placeholder="Add a note about this interaction..." value={noteContent} onChange={e => setNoteContent(e.target.value)} required style={{ flex: 1 }} />
                <button className="primary">Add Note</button>
              </form>
            </div>
          </div>
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
