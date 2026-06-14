import React, { useState } from "react";
import { api } from "../services/api";
import { useAsync } from "../hooks/useAsync";
import { useOutletContext } from "react-router-dom";
import { titleCase, formatDate, downloadCsv } from "../utils/helpers";
import { NOTIFICATION_TYPES } from "../utils/constants";
import { PanelHeader, Select, DataTable, Badge, RowActions, Loading, ErrorState } from "../components/ui";
import { Pagination } from "../components/Pagination";

export function Notifications() {
  const { setNotice } = useOutletContext();
  const [filters, setFilters] = useState({ isRead: "", type: "" });
  const [page, setPage] = useState(1);
  const { data, loading, error, refresh } = useAsync(() => api.notifications({ ...filters, page, limit: 10 }), [filters.isRead, filters.type, page]);

  async function markAll() {
    await api.markAllNotificationsRead();
    setNotice("Notifications marked read");
    refresh();
  }

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={refresh} />;
  const rows = data?.notifications || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1 };

  return (
    <section className="stack">
      <PanelHeader title="Notification center" action={<RowActions><button onClick={markAll}>Mark all read</button><button onClick={() => downloadCsv("notifications.csv", rows)}>Export CSV</button></RowActions>} />
      <div className="filters">
        <Select value={filters.isRead} onChange={(e) => setFilters({ ...filters, isRead: e.target.value })} options={["", "false", "true"]} labels={{ false: "Unread", true: "Read" }} placeholder="All read states" />
        <Select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })} options={["", ...NOTIFICATION_TYPES]} placeholder="All types" />
      </div>
      <DataTable
        columns={["Title", "Message", "Type", "Status", "Created", "Actions"]}
        rows={rows.map((item) => [
          item.title,
          item.message,
          <Badge tone={item.type === "WARNING" ? "warning" : item.type === "SUCCESS" ? "success" : "info"}>{titleCase(item.type)}</Badge>,
          item.isRead ? "Read" : "Unread",
          formatDate(item.createdAt, true),
          <RowActions>
            {!item.isRead && <button onClick={async () => { await api.markNotificationRead(item.id); refresh(); }}>Read</button>}
            <button onClick={async () => { await api.deleteNotification(item.id); refresh(); }}>Delete</button>
          </RowActions>,
        ])}
      />
      <Pagination page={pagination.page} totalPages={pagination.totalPages} setPage={setPage} />
    </section>
  );
}
