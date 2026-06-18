const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth.middleware');
const authorize = require('../../middlewares/role.middleware');
const attendanceController = require('./attendance.controller');

router.use(authMiddleware);


router.post('/check-in', authorize('BDE', 'TELESALES'), attendanceController.checkIn);


router.patch('/check-out', authorize('BDE', 'TELESALES'), attendanceController.checkOut);


router.get('/my', authorize('SUPER_ADMIN', 'HR', 'BDE', 'TELESALES'), attendanceController.getMyAttendance);


router.get('/', authorize('SUPER_ADMIN', 'HR'), attendanceController.getAttendanceRecords);


router.get('/user/:userId', authorize('SUPER_ADMIN', 'HR'), attendanceController.getUserAttendance);

module.exports = router;
