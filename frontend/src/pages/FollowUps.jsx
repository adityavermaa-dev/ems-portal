import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "../services/api";
import { useAsync } from "../hooks/useAsync";
import { useForm } from "../hooks/useForm";
import { toInputDateTime, downloadCsv } from "../utils/helpers";
import { PanelHeader, FollowUpList, EmptyState } from "../components/ui";
import { Phone, Mail, Calendar } from "lucide-react";

export function FollowUps() {
  const { user, isAdmin, setNotice } = useOutletContext();
  const [selectedLead, setSelectedLead] = useState(null);

  const leadsState = useAsync(() => api.leads({ limit: 100 }), []);
  const history = useAsync(() => selectedLead ? api.followUpsByLead(selectedLead.id) : Promise.resolve([]), [selectedLead]);
  
  const form = useForm({ 
    notes: "", 
    followUpDate: toInputDateTime(new Date()), 
    nextFollowUpDate: "" 
  });

  async function createFollowUp(event) {
    event.preventDefault();
    if (!selectedLead) return;
    
    try {
      await api.createFollowUp({
        ...form.values,
        leadId: selectedLead.id
      });
      setNotice("Follow-up logged successfully");
      form.reset();
      history.refresh();
    } catch (error) {
      setNotice(error.message);
    }
  }

  const leads = leadsState.data?.leads || [];

  return (
    <section className="stack">
      <div className="hero-band">
        <div>
          <h1>Call Workspace</h1>
          <p>Select a lead from your list to log calls and view history.</p>
        </div>
      </div>

      <div className="split-layout">
        {/* LEFT PANE: Leads List */}
        <div className="table-panel" style={{ padding: 0, overflow: 'hidden' }}>
          <PanelHeader title={isAdmin ? "All Leads (Admin)" : "My Assigned Leads"} />
          <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
            {leads.length === 0 ? (
              <EmptyState text="No leads assigned to you" />
            ) : (
              leads.map((lead) => (
                <div 
                  key={lead.id} 
                  className={`lead-list-item ${selectedLead?.id === lead.id ? 'active' : ''}`}
                  onClick={() => setSelectedLead(lead)}
                >
                  <strong>{lead.name}</strong>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Phone size={14} /> {lead.phone}
                    </span>
                    <span className={`badge ${lead.status === 'NEW' ? 'info' : 'warning'}`}>
                      {lead.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT PANE: Workspace */}
        <div className="stack">
          {!selectedLead ? (
            <div className="table-panel">
              <EmptyState 
                text="Select a lead to begin" 
                subtext="Choose a lead from the left pane to view their history and log a new call." 
              />
            </div>
          ) : (
            <>
              {/* Form Panel */}
              <div className="table-panel">
                <PanelHeader 
                  title={`Log interaction with ${selectedLead.name}`} 
                  action={<span className="badge info">{selectedLead.status}</span>}
                />
                <form className="form-grid" onSubmit={createFollowUp}>
                  <label>
                    Date & Time of Call
                    <input 
                      type="datetime-local" 
                      max={toInputDateTime(new Date())} 
                      value={form.values.followUpDate} 
                      onChange={(e) => form.set("followUpDate", e.target.value)} 
                      required 
                    />
                  </label>
                  <label>
                    Schedule Next Reminder (Optional)
                    <input 
                      type="datetime-local" 
                      value={form.values.nextFollowUpDate} 
                      onChange={(e) => form.set("nextFollowUpDate", e.target.value)} 
                    />
                  </label>
                  <label className="wide">
                    Interaction Notes
                    <textarea 
                      placeholder={`What did you discuss with ${selectedLead.name}?`}
                      value={form.values.notes} 
                      onChange={(e) => form.set("notes", e.target.value)} 
                      required 
                      rows={3}
                    />
                  </label>
                  <button className="primary" style={{ width: 'fit-content' }}>Save Interaction</button>
                </form>
              </div>

              {/* History Panel */}
              <div className="table-panel">
                <PanelHeader title="Previous History" />
                <FollowUpList rows={history.data || []} loading={history.loading} />
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
