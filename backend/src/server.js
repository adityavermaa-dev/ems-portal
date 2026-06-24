const http = require('http');
const app = require('./app');
const prisma = require('./config/prisma');
const { initializeSocket } = require('./config/socket');
const dotenv = require("dotenv");
const path = require("path");
const { validateEnv } = require("./config/env.validator");

dotenv.config({ path: path.join(__dirname, "..", ".env") });


validateEnv();

const PORT = process.env.PORT || 9999;

async function startServer() {
    try {
        await prisma.$connect();
        console.log("✅ Database Connected");

        
        const httpServer = http.createServer(app);
        const io = initializeSocket(httpServer);

        
        app.set('io', io);

        httpServer.listen(PORT, () => {
            console.log(`🚀 Server is listening on port ${PORT}`);
            console.log(`📡 Socket.IO ready for real-time connections`);
            console.log(`📋 API Endpoints:`);
            console.log(`   Auth:          http://localhost:${PORT}/api/auth`);
            console.log(`   Users:         http://localhost:${PORT}/api/users`);
            console.log(`   Leads:         http://localhost:${PORT}/api/leads`);
            console.log(`   Follow-Ups:    http://localhost:${PORT}/api/follow-ups`);
            console.log(`   Tasks:         http://localhost:${PORT}/api/tasks`);
            console.log(`   Attendance:    http://localhost:${PORT}/api/attendance`);
            console.log(`   Messages:      http://localhost:${PORT}/api/messages`);
            console.log(`   Notifications: http://localhost:${PORT}/api/notifications`);
            console.log(`   Activity Logs: http://localhost:${PORT}/api/activity-logs`);
        });
    } catch (error) {
        console.log("❌ Database connection failed: " + error);
        process.exit(1);
    }
}

process.on("SIGINT", async () => {
    console.log("\n🔄 Graceful shutdown initiated...");
    await prisma.$disconnect();
    console.log("✅ Database disconnected");
    process.exit(0);
});

startServer();
// restart nodemon to load generated prisma client