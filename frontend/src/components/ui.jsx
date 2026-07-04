import React from "react";
import { cx, titleCase, formatDate } from "../utils/helpers";

export function DataTable({ columns, rows }) {
  return (
    <div className="table-panel">
      <div className="table-scroll">
        <table>
          <thead>
            <tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row, index) => (
                <tr key={index}>
                  {row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length}>
                  <EmptyState text="No records found." />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Select({ options, labels = {}, placeholder, ...props }) {
  return (
    <select {...props}>
      {options.map((option) => (
        <option key={String(option)} value={option}>
          {option === "" ? placeholder || "Select" : labels[option] || titleCase(option)}
        </option>
      ))}
    </select>
  );
}

export function PanelHeader({ title, action }) {
  return (
    <div className="panel-header">
      <h3>{title}</h3>
      {action}
    </div>
  );
}

export function Badge({ tone = "info", children }) {
  return <span className={cx("badge", tone)}>{children}</span>;
}

export function RowActions({ children }) {
  return <div className="row-actions">{children}</div>;
}

export function Modal({ title, children, onClose, className = "", style }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true">
      <div className={cx("modal", className)} style={style}>
        <PanelHeader title={title} action={<button onClick={onClose}>Close</button>} />
        {children}
      </div>
    </div>
  );
}

export function EmptyState({ text }) {
  return <div className="empty">{text}</div>;
}

export function Loading({ compact }) {
  return <div className={cx("loading", compact && "compact")}>Loading...</div>;
}

export function ErrorState({ error, onRetry }) {
  return (
    <div className="alert danger">
      {error}
      <button onClick={onRetry}>Retry</button>
    </div>
  );
}

export function Metric({ label, value, detail, tone = "default", icon: Icon }) {
  return (
    <div className={cx("metric", tone)}>
      <div className="metric-header">
        {Icon && <Icon size={18} />}
        <span>{label}</span>
      </div>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}

export function AnalyticsCard({ title, items }) {
  const max = Math.max(1, ...items.map((item) => item[1]));
  return (
    <div className="table-panel">
      <PanelHeader title={title} />
      <div className="bars">
        {items.map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <div><i style={{ width: `${(value / max) * 100}%` }} /></div>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FollowUpList({ rows = [], loading }) {
  if (loading) return <Loading compact />;
  if (!rows.length) return <EmptyState text="No follow-ups to show." />;
  return (
    <div className="list">
      {rows.map((item) => (
        <article key={item.id}>
          <div>
            <strong>{item.lead?.name || `Lead #${item.leadId}`}</strong>
            <small>{item.notes}</small>
          </div>
          <span>{formatDate(item.nextFollowUpDate || item.followUpDate, true)}</span>
        </article>
      ))}
    </div>
  );
}
