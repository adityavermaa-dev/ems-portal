import { buildQuery } from "../utils/helpers";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

async function request(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  
  const headers = { ...options.headers };
  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...options,
    headers,
    body: isFormData ? options.body : (options.body ? JSON.stringify(options.body) : undefined),
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : {};
  if (!response.ok || payload.success === false) {
    throw new Error(payload.message || `Request failed with ${response.status}`);
  }
  return payload.data ?? payload.user ?? payload;
}

export const api = {
  login: (body) => request("/api/auth/login", { method: "POST", body }),
  logout: () => request("/api/auth/logout", { method: "POST" }),
  profile: () => request("/profile"),
  users: () => request("/api/users"),
  createUser: (body) => request("/api/users", { method: "POST", body }),
  updateUser: (id, body) => request(`/api/users/${id}`, { method: "PATCH", body }),
  updateUserStatus: (id, isActive) => request(`/api/users/${id}/status`, { method: "PATCH", body: { isActive } }),
  resetPassword: (id, newPassword) => request(`/api/users/${id}/reset-password`, { method: "PATCH", body: { newPassword } }),
  leads: (params) => request(`/api/leads${buildQuery(params)}`),
  getLeadById: (id) => request(`/api/leads/${id}`),
  createLead: (body) => request("/api/leads", { method: "POST", body }),
  importLeads: (body) => request("/api/leads/import", { method: "POST", body }),
  updateLead: (id, body) => request(`/api/leads/${id}`, { method: "PUT", body }),
  updateLeadStatus: (id, status) => request(`/api/leads/${id}/status`, { method: "PATCH", body: { status } }),
  assignLead: (id, assignedTo) => request(`/api/leads/${id}/assign`, { method: "PATCH", body: { assignedTo } }),
  createLeadNote: (id, body) => request(`/api/leads/${id}/notes`, { method: "POST", body }),
  getLeadNotes: (id) => request(`/api/leads/${id}/notes`),
  followUpsAll: () => request("/api/follow-ups"),
  followUpsUpcoming: () => request("/api/follow-ups/upcoming"),
  followUpsOverdue: () => request("/api/follow-ups/overdue"),
  followUpsByLead: (leadId) => request(`/api/follow-ups/lead/${leadId}`),
  createFollowUp: (body) => request("/api/follow-ups", { method: "POST", body }),
  tasks: (params) => request(`/api/tasks${buildQuery(params)}`),
  createTask: (body) => request("/api/tasks", { method: "POST", body }),
  updateTaskStatus: (id, status) => request(`/api/tasks/${id}/status`, { method: "PATCH", body: { status } }),
  overdueReason: (id, reason) => request(`/api/tasks/${id}/overdue-reason`, { method: "PATCH", body: { reason } }),
  checkIn: (body) => request("/api/attendance/check-in", { method: "POST", body }),
  checkOut: (body) => request("/api/attendance/check-out", { method: "PATCH", body }),
  myAttendance: (params) => request(`/api/attendance/my${buildQuery(params)}`),
  attendance: (params) => request(`/api/attendance${buildQuery(params)}`),
  // Force Vite HMR reload
  sendAttendanceReminder: () => request("/api/attendance/remind", { method: "POST" }),
  notifications: (params) => request(`/api/notifications${buildQuery(params)}`),
  unreadCount: () => request("/api/notifications/unread-count"),
  markNotificationRead: (id) => request(`/api/notifications/${id}/read`, { method: "PATCH" }),
  markAllNotificationsRead: () => request("/api/notifications/read-all", { method: "PATCH" }),
  deleteNotification: (id) => request(`/api/notifications/${id}`, { method: "DELETE" }),
  conversations: () => request("/api/messages/conversations"),
  conversation: (id) => request(`/api/messages/conversation/${id}`),
  sendMessage: (body) => request("/api/messages/send", { method: "POST", body }),
  markConversationRead: (id) => request(`/api/messages/conversation/${id}/read`, { method: "PATCH" }),
  activityLogs: (path = "/api/activity-logs/my", params) => request(`${path}${buildQuery(params)}`),
  analytics: () => request("/api/analytics"),
  leaves: () => request("/api/leaves"),
  myLeaves: () => request("/api/leaves/my"),
  createLeave: (body) => request("/api/leaves", { method: "POST", body }),
  updateLeaveStatus: (id, status) => request(`/api/leaves/${id}/status`, { method: "PATCH", body: { status } }),
};
