const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth.middleware');
const authorize = require('../../middlewares/role.middleware');
const leaveController = require('./leave.controller');

router.use(authMiddleware);

// Employee routes
router.post('/', leaveController.createLeaveRequest);
router.get('/my', leaveController.getMyLeaveRequests);

// HR / Admin routes
router.get('/', authorize('SUPER_ADMIN', 'HR'), leaveController.getAllLeaveRequests);
router.patch('/:id/status', authorize('SUPER_ADMIN', 'HR'), leaveController.updateLeaveStatus);

module.exports = router;
