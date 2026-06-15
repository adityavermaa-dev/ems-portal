import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "../services/api";
import { useAsync } from "../hooks/useAsync";
import { titleCase, formatDate, downloadCsv } from "../utils/helpers";
import { PanelHeader, EmptyState, DataTable, Badge, Loading, ErrorState, Select } from "../components/ui";
import { Pagination } from "../components/Pagination";

export function Attendance() {
  const { canUseAttendanceActions: canAct, isAdmin, setNotice, user } = useOutletContext();
  const [filters, setFilters] = useState({ startDate: "", endDate: "", isInsideOffice: "" });
  const [page, setPage] = useState(1);
  const { data, loading, error, refresh } = useAsync(() => (isAdmin ? api.attendance({ ...filters, page, limit: 10 }) : api.myAttendance({ ...filters, page, limit: 10 })), [filters.startDate, filters.endDate, filters.isInsideOffice, isAdmin, page]);

  async function withLocation(action) {
    if (!navigator.geolocation) {
      setNotice("GPS is not available in this browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(async (position) => {
      try {
        const body = { latitude: position.coords.latitude, longitude: position.coords.longitude };
        await (action === "in" ? api.checkIn(body) : api.checkOut(body));
        setNotice(action === "in" ? "Checked in" : "Checked out");
        refresh();
      } catch (error) {
        setNotice(error.message);
      }
    }, () => setNotice("Location permission is required"));
  }

  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} onRetry={refresh} />;
  const records = data?.records || [];
  const pagination = data?.pagination || { page: 1, totalPages: 1 };

  return (
    <section className="stack">
      <PanelHeader title="Attendance management" action={user.role === "SUPER_ADMIN" && <button onClick={() => downloadCsv("attendance.csv", records)}>Export CSV</button>} />
      <div className="filters">
        <input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
        <input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
        {isAdmin && <Select value={filters.isInsideOffice} onChange={(e) => setFilters({ ...filters, isInsideOffice: e.target.value })} options={["", "true", "false"]} labels={{ true: "Inside office", false: "Outside office" }} placeholder="All locations" />}
        {canAct && <button className="primary" onClick={() => withLocation("in")}>Check in</button>}
        {canAct && <button onClick={() => withLocation("out")}>Check out</button>}
      </div>
      <DataTable
        columns={["Employee", "Date", "Status", "Check in", "Check out", "Location"]}
        rows={records.map((record) => [
          record.user?.name || "Me",
          formatDate(record.date),
          <Badge tone={record.status === "PRESENT" ? "success" : "warning"}>{titleCase(record.status)}</Badge>,
          formatDate(record.checkIn, true),
          formatDate(record.checkOut, true),
          record.isInsideOffice === null || record.isInsideOffice === undefined ? "-" : <Badge tone={record.isInsideOffice ? "success" : "danger"}>{record.isInsideOffice ? "Inside" : `Outside ${Math.round(record.officeDistanceMeters || 0)}m`}</Badge>,
        ])}
      />
      <Pagination page={pagination.page} totalPages={pagination.totalPages} setPage={setPage} />
    </section>
  );
}
