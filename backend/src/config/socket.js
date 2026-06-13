const { Server } = require('socket.io');
const { verifyToken } = require('../utils/jwt');

// Map userId -> Set of socketIds (user can have multiple tabs)
const onlineUsers = new Map();

function initializeSocket(httpServer) {
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:5173',
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    // Authentication middleware
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token ||
                          socket.handshake.headers.cookie?.split('accessToken=')[1]?.split(';')[0];

            if (!token) {
                return next(new Error('Authentication required'));
            }

            const decoded = verifyToken(token);
            socket.userId = decoded.userId;
            socket.userRole = decoded.role;
            next();
        } catch (error) {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket) => {
        const userId = socket.userId;
        console.log(`User ${userId} connected (socket: ${socket.id})`);

        // Join user's personal room for targeted notifications
        socket.join(`user_${userId}`);

        // Track online status
        if (!onlineUsers.has(userId)) {
            onlineUsers.set(userId, new Set());
        }
        onlineUsers.get(userId).add(socket.id);

        // Broadcast online status
        io.emit('user_online', { userId });

        // Handle typing indicators
        socket.on('typing', (data) => {
            io.to(`user_${data.receiverId}`).emit('user_typing', {
                userId,
                isTyping: data.isTyping
            });
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log(`User ${userId} disconnected (socket: ${socket.id})`);

            if (onlineUsers.has(userId)) {
                onlineUsers.get(userId).delete(socket.id);
                if (onlineUsers.get(userId).size === 0) {
                    onlineUsers.delete(userId);
                    io.emit('user_offline', { userId });
                }
            }
        });
    });

    return io;
}

function getOnlineUsers() {
    return Array.from(onlineUsers.keys());
}

module.exports = { initializeSocket, getOnlineUsers };
