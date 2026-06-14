import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "../services/api";
import { useAsync } from "../hooks/useAsync";
import { titleCase, formatDate, downloadCsv } from "../utils/helpers";
import { PanelHeader, DataTable, Loading, ErrorState } from "../components/ui";
import { Pagination } from "../components/Pagination";

export function Activity() {
  const { user, isAdmin } = useOutletContext();
  const [filters, setFilters] = useState({ action: "", entityType: "", startDate: "", endDate: "" });
  const [page, setPage] = useState(1);
  const path = user.role === "SUPER_ADMIN" ? "/api/activity-logs" : "/api/activity-logs/my";
  const { data, loading, error, refresh } = useAsync(() => api.activityLogs(path, { ...filters, page, limit: 10 }), [filters.action, filters.entityType, filters.startDate, filters.endDate, path, page]);

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={refresh} />;
  const logs = data?.logs || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1 };

  return (
    <section className="stack">
      <PanelHeader title={isAdmin ? "Activity logs" : "My activity"} action={<button onClick={() => downloadCsv("activity-logs.csv", logs)}>Export CSV</button>} />
      <div className="filters">
        <input placeholder="Action" value={filters.action} onChange={(e) => setFilters({ ...filters, action: e.target.value })} />
        <input placeholder="Entity" value={filters.entityType} onChange={(e) => setFilters({ ...filters, entityType: e.target.value })} />
        <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
        <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
      </div>
      <DataTable
        columns={["User", "Action", "Entity", "Details", "Created"]}
        rows={logs.map((log) => [
          log.user?.name || "Me",
          titleCase(log.action),
          log.entityType,
          log.details || `ID ${log.entityId || "-"}`,
          formatDate(log.createdAt, true),
        ])}
      />
      <Pagination page={pagination.page} totalPages={pagination.totalPages} setPage={setPage} />
    </section>
  );
}
