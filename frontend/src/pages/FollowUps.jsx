import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "../services/api";
import { useAsync } from "../hooks/useAsync";
import { useForm } from "../hooks/useForm";
import { toInputDateTime, downloadCsv } from "../utils/helpers";
import { PanelHeader, Select, FollowUpList } from "../components/ui";

export function FollowUps() {
  const { setNotice } = useOutletContext();
  const [leadId, setLeadId] = useState("");
  const leadsState = useAsync(() => api.leads({ limit: 100 }), []);
  const upcoming = useAsync(api.followUpsUpcoming, []);
  const overdue = useAsync(api.followUpsOverdue, []);
  const history = useAsync(() => leadId ? api.followUpsByLead(leadId) : Promise.resolve([]), [leadId]);
  const form = useForm({ leadId: "", notes: "", followUpDate: toInputDateTime(new Date()), nextFollowUpDate: "" });

  async function createFollowUp(event) {
    event.preventDefault();
    try {
      await api.createFollowUp(form.values);
      setNotice("Follow-up logged");
      form.reset();
      upcoming.refresh();
      overdue.refresh();
      history.refresh();
    } catch (error) {
      setNotice(error.message);
    }
  }

  const leads = leadsState.data?.leads || [];

  return (
    <section className="stack">
      <PanelHeader title="Follow-up tracking" action={<button onClick={() => downloadCsv("follow-ups.csv", [...(upcoming.data || []), ...(overdue.data || []), ...(history.data || [])])}>Export CSV</button>} />
      <form className="form-grid" onSubmit={createFollowUp}>
        <label>Lead<Select value={form.values.leadId} onChange={(e) => form.set("leadId", e.target.value)} options={leads.map((lead) => lead.id)} labels={Object.fromEntries(leads.map((lead) => [lead.id, `${lead.name} - ${lead.phone}`]))} required /></label>
        <label>Follow-up date<input type="datetime-local" max={toInputDateTime(new Date())} value={form.values.followUpDate} onChange={(e) => form.set("followUpDate", e.target.value)} required /></label>
        <label>Next reminder<input type="datetime-local" value={form.values.nextFollowUpDate} onChange={(e) => form.set("nextFollowUpDate", e.target.value)} /></label>
        <label className="wide">Notes<textarea value={form.values.notes} onChange={(e) => form.set("notes", e.target.value)} required /></label>
        <button className="primary">Save follow-up</button>
      </form>
      <div className="two-col">
        <div className="table-panel"><PanelHeader title="Overdue" /><FollowUpList rows={overdue.data || []} loading={overdue.loading} /></div>
        <div className="table-panel"><PanelHeader title="Upcoming" /><FollowUpList rows={upcoming.data || []} loading={upcoming.loading} /></div>
      </div>
      <div className="table-panel">
        <PanelHeader title="Lead follow-up history" action={<Select value={leadId} onChange={(e) => setLeadId(e.target.value)} options={["", ...leads.map((lead) => lead.id)]} labels={Object.fromEntries(leads.map((lead) => [lead.id, lead.name]))} placeholder="Choose lead" />} />
        <FollowUpList rows={history.data || []} loading={history.loading} />
      </div>
    </section>
  );
}
