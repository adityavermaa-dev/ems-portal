export function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

export function titleCase(value = "") {
  return String(value)
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatDate(value, withTime = false) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: withTime ? "short" : undefined,
  }).format(date);
}

export function formatDuration(start, end) {
  if (!start || !end) return "-";
  const startDate = new Date(start);
  const endDate = new Date(end);
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return "-";
  
  const diffMs = endDate.getTime() - startDate.getTime();
  if (diffMs < 0) return "-";

  const diffMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  
  return `${hours}h ${mins}m`;
}

export function toInputDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export function toInputDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

export function buildQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.set(key, value);
  });
  const text = query.toString();
  return text ? `?${text}` : "";
}

export function downloadCsv(filename, rows) {
  if (!rows?.length) return;
  const columns = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((key) => set.add(key));
      return set;
    }, new Set())
  );
  const csv = [columns.join(",")]
    .concat(
      rows.map((row) =>
        columns
          .map((key) => {
            let value = row[key] ?? "";
            if (typeof value === "object" && value !== null) {
              if (Array.isArray(value)) {
                value = `[${value.length} items]`;
              } else if (value.name) {
                value = value.name;
              } else if (value.title) {
                value = value.title;
              } else if (value.id) {
                value = value.id;
              } else {
                value = JSON.stringify(value);
              }
            }
            return `"${String(value).replaceAll('"', '""')}"`;
          })
          .join(",")
      )
    )
    .join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function countBy(rows = [], getKey) {
  return rows.reduce((acc, row) => {
    const key = getKey(row) || "UNKNOWN";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}
