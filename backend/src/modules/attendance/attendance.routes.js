const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth.middleware');
const authorize = require('../../middlewares/role.middleware');
const attendanceController = require('./attendance.controller');

router.use(authMiddleware);

// Check in with GPS - BDE, TELESALES (employees)
router.post('/check-in', authorize('BDE', 'TELESALES'), attendanceController.checkIn);

// Check out - BDE, TELESALES
router.patch('/check-out', authorize('BDE', 'TELESALES'), attendanceController.checkOut);

// Get own attendance history
router.get('/my', authorize('SUPER_ADMIN', 'HR', 'BDE', 'TELESALES'), attendanceController.getMyAttendance);

// Get all attendance records - Admin/HR
router.get('/', authorize('SUPER_ADMIN', 'HR'), attendanceController.getAttendanceRecords);

// Get specific user's attendance - Admin/HR
router.get('/user/:userId', authorize('SUPER_ADMIN', 'HR'), attendanceController.getUserAttendance);

module.exports = router;
