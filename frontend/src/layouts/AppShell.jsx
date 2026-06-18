import React, { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { titleCase, cx } from "../utils/helpers";
import { EMPLOYEE_ROLES } from "../utils/constants";
import { useSocket } from "../hooks/useSocket";
import { Bell, Menu, X } from "lucide-react";
import { api } from "../services/api";

export function AppShell() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const socket = useSocket();
  const [notice, setNotice] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    api.unreadCount().then(res => setUnreadCount(res.unreadCount || 0)).catch(() => {});
  }, []);

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
      setUnreadCount(prev => prev + 1);
      setNotice(notif.message);
    });

    return () => {
      socket.off('new_message');
      socket.off('new_notification');
    };
  }, [socket]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  if (!user) return null;

  const isAdmin = ["SUPER_ADMIN", "HR"].includes(user.role);
  const canManageUsers = user.role === "SUPER_ADMIN";
  const canUseAttendanceActions = EMPLOYEE_ROLES.includes(user.role);

  const navigation = [
    ["/dashboard", "Dashboard"],
    ...(isAdmin ? [["/analytics", "Analytics"]] : []),
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

  return (
    <div className="app-shell">
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
      <aside className={cx("sidebar", sidebarOpen && "open")}>
        <div className="brand">
          <span className="brand-mark">ZT</span>
          <div>
            <strong>EMS Portal</strong>
            <small>{titleCase(user.role)}</small>
          </div>
          <button className="mobile-close" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
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
          <div className="topbar-left">
            <button className="mobile-toggle" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} color="#1a2530" />
            </button>
            <div>
              <p className="eyebrow">Signed in as</p>
              <h2>{user.name || "EMS User"}</h2>
            </div>
          </div>
          <div className="topbar-actions">
            {notice && <span className="toast">{notice}</span>}
            <div className="notification-bell" onClick={() => navigate("/notifications")} style={{ position: 'relative', cursor: 'pointer', padding: '8px' }}>
              <Bell size={20} color="#53636e" />
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: 0, right: 0, background: '#e11d48', color: 'white', fontSize: '0.65rem', padding: '2px 6px', borderRadius: '99px', fontWeight: 'bold' }}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
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
