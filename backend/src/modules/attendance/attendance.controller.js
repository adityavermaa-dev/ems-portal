const attendanceService = require('./attendance.service');

async function checkIn(req, res) {
    try {
        const { latitude, longitude } = req.body;

        const io = req.app.get('io');
        const attendance = await attendanceService.checkIn(
            req.user.userId,
            latitude,
            longitude,
            io
        );

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
            latitude,
            longitude
        );

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

async function sendReminder(req, res) {
    try {
        const io = req.app.get('io');
        const result = await attendanceService.sendReminder(req.user.userId, io);
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
    getUserAttendance,
    sendReminder
};
