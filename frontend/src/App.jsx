import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { Loading } from "./components/ui";

import { AppShell } from "./layouts/AppShell";

const Dashboard = React.lazy(() => import("./pages/Dashboard").then(m => ({ default: m.Dashboard })));
const Analytics = React.lazy(() => import("./pages/Analytics").then(m => ({ default: m.default })));
const Users = React.lazy(() => import("./pages/Users").then(m => ({ default: m.Users })));
const Leads = React.lazy(() => import("./pages/Leads").then(m => ({ default: m.Leads })));
const FollowUps = React.lazy(() => import("./pages/FollowUps").then(m => ({ default: m.FollowUps })));
const Tasks = React.lazy(() => import("./pages/Tasks").then(m => ({ default: m.Tasks })));
const Attendance = React.lazy(() => import("./pages/Attendance").then(m => ({ default: m.Attendance })));
const Leave = React.lazy(() => import("./pages/Leave").then(m => ({ default: m.Leave })));
const SalesTargets = React.lazy(() => import("./pages/SalesTargets").then(m => ({ default: m.SalesTargets })));
const Messages = React.lazy(() => import("./pages/Messages").then(m => ({ default: m.Messages })));
const Notifications = React.lazy(() => import("./pages/Notifications").then(m => ({ default: m.Notifications })));
const Activity = React.lazy(() => import("./pages/Activity").then(m => ({ default: m.Activity })));

export default function App() {
  const { user, isBooting, checkSession } = useAuthStore();

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  if (isBooting) {
    return <Loading />;
  }

  if (!user) {
    const LoginScreen = React.lazy(() => import("./pages/Login").then(m => ({ default: m.LoginScreen })));
    return (
      <React.Suspense fallback={<Loading />}>
        <LoginScreen />
      </React.Suspense>
    );
  }

  return (
    <BrowserRouter>
      <React.Suspense fallback={<Loading />}>
        <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="users" element={<Users />} />
          <Route path="leads" element={<Leads />} />
          <Route path="followups" element={<FollowUps />} />
          <Route path="tasks" element={<Tasks />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="leaves" element={<Leave />} />
          <Route path="sales-targets" element={<SalesTargets />} />
          <Route path="messages" element={<Messages />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="activity" element={<Activity />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
      </React.Suspense>
    </BrowserRouter>
  );
}
