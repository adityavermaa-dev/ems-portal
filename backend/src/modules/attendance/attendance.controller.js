const attendanceService = require('./attendance.service');
const { logActivity } = require('../../utils/activityLogger');
const { createNotification } = require('../../utils/notificationHelper');
const prisma = require('../../config/prisma');

async function checkIn(req, res) {
    try {
        const { latitude, longitude } = req.body;

        if (latitude === undefined || longitude === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Latitude and longitude are required'
            });
        }

        const attendance = await attendanceService.checkIn(
            req.user.userId,
            parseFloat(latitude),
            parseFloat(longitude)
        );

        await logActivity(req.user.userId, 'CHECK_IN', 'Attendance', attendance.id);

        // If outside office, notify HR users
        if (!attendance.gpsInfo.isInsideOffice) {
            const io = req.app.get('io');
            const hrUsers = await prisma.user.findMany({
                where: {
                    role: { name: { in: ['SUPER_ADMIN', 'HR'] } },
                    isActive: true
                }
            });

            for (const hr of hrUsers) {
                await createNotification(
                    hr.id,
                    'Outside Office Check-In',
                    `Employee checked in from outside office (${attendance.gpsInfo.distanceFromOffice} away).`,
                    'WARNING',
                    io
                );
            }
        }

        res.status(201).json({ success: true, data: attendance });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

async function checkOut(req, res) {
    try {
        const { latitude, longitude } = req.body;

        const attendance = await attendanceService.checkOut(
            req.user.userId,
            latitude ? parseFloat(latitude) : undefined,
            longitude ? parseFloat(longitude) : undefined
        );

        await logActivity(req.user.userId, 'CHECK_OUT', 'Attendance', attendance.id);

        res.json({ success: true, data: attendance });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

async function getAttendanceRecords(req, res) {
    try {
        const result = await attendanceService.getAttendanceRecords(req.query);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

async function getMyAttendance(req, res) {
    try {
        const result = await attendanceService.getMyAttendance(req.user.userId, req.query);
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

async function getUserAttendance(req, res) {
    try {
        const result = await attendanceService.getUserAttendance(
            Number(req.params.userId),
            req.query
        );
        res.json({ success: true, data: result });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
}

module.exports = {
    checkIn,
    checkOut,
    getAttendanceRecords,
    getMyAttendance,
    getUserAttendance
};
