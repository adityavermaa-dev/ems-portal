const express = require('express');
const app = express();
const dotenv = require("dotenv");
const path = require("path");
const cors = require("cors");
const cookieParser = require("cookie-parser");

// Middleware imports
const authMiddleware = require("./middlewares/auth.middleware");

// Route imports
const authRoutes = require("./modules/auth/auth.route");
const userRoutes = require("./modules/user/user.routes");
const leadRoutes = require("./modules/lead/lead.routes");
const followUpRoutes = require("./modules/followUp/followUp.routes");
const taskRoutes = require("./modules/task/task.routes");
const attendanceRoutes = require("./modules/attendance/attendance.routes");
const messageRoutes = require("./modules/message/message.routes");
const notificationRoutes = require("./modules/notification/notification.routes");
const activityLogRoutes = require("./modules/activityLog/activityLog.routes");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Global Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/follow-ups", followUpRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/activity-logs", activityLogRoutes);

// Health check
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "EMS Portal API Running",
        version: "1.0.0",
        endpoints: {
            auth: "/api/auth",
            users: "/api/users",
            leads: "/api/leads",
            followUps: "/api/follow-ups",
            tasks: "/api/tasks",
            attendance: "/api/attendance",
            messages: "/api/messages",
            notifications: "/api/notifications",
            activityLogs: "/api/activity-logs"
        }
    });
});

// Profile route
app.get("/profile", authMiddleware, (req, res) => {
    res.json(req.user);
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error("Unhandled Error:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
});

module.exports = app;
