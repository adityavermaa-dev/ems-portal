const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth.middleware');
const authorize = require('../../middlewares/role.middleware');
const activityLogController = require('./activityLog.controller');

router.use(authMiddleware);

// Get own activity logs
router.get('/my', authorize('SUPER_ADMIN', 'HR', 'BDE', 'TELESALES'), activityLogController.getMyActivityLogs);

// Get all activity logs - SUPER_ADMIN only
router.get('/', authorize('SUPER_ADMIN'), activityLogController.getActivityLogs);

// Get specific user's activity logs - SUPER_ADMIN, HR
router.get('/user/:userId', authorize('SUPER_ADMIN', 'HR'), activityLogController.getUserActivityLogs);

module.exports = router;
