import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { titleCase, cx } from "../utils/helpers";
import { EMPLOYEE_ROLES } from "../utils/constants";
import { useSocket } from "../hooks/useSocket";

export function AppShell() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const socket = useSocket();
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => setNotice(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [notice]);

  useEffect(() => {
    if (!socket) return;

    socket.on('new_message', (msg) => {
      setNotice(`New message from ${msg.sender?.name || 'someone'}`);
    });

    socket.on('new_notification', (notif) => {
      setNotice(notif.message);
    });

    return () => {
      socket.off('new_message');
      socket.off('new_notification');
    };
  }, [socket]);

  if (!user) return null;

  const isAdmin = ["SUPER_ADMIN", "HR"].includes(user.role);
  const canManageUsers = user.role === "SUPER_ADMIN";
  const canUseAttendanceActions = EMPLOYEE_ROLES.includes(user.role);

  const navigation = [
    ["/dashboard", "Dashboard"],
    ["/leads", "Leads"],
    ["/followups", "Follow-Ups"],
    ["/tasks", "Tasks"],
    ["/attendance", "Attendance"],
    ["/messages", "Messages"],
    ["/notifications", "Notifications"],
    ["/activity", "Activity"],
    ...(canManageUsers ? [["/users", "Users"]] : []),
  ];

  async function handleLogout() {
    await logout();
  }

  // Provide notice capability to children via React context if needed, 
  // but for simplicity we will just pass it down via Outlet context.
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">ZT</span>
          <div>
            <strong>EMS Portal</strong>
            <small>{titleCase(user.role)}</small>
          </div>
        </div>
        <nav>
          {navigation.map(([path, label]) => (
            <button
              key={path}
              className={cx(location.pathname === path && "active")}
              onClick={() => navigate(path)}
            >
              {label}
            </button>
          ))}
        </nav>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Signed in as</p>
            <h2>{user.name || "EMS User"}</h2>
          </div>
          <div className="topbar-actions">
            {notice && <span className="toast">{notice}</span>}
            <button className="secondary" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>
        <main>
          <Outlet context={{ user, isAdmin, canManageUsers, canUseAttendanceActions, setNotice }} />
        </main>
      </div>
    </div>
  );
}
