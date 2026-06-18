const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth.middleware');
const authorize = require('../../middlewares/role.middleware');
const activityLogController = require('./activityLog.controller');

router.use(authMiddleware);


router.get('/my', authorize('SUPER_ADMIN', 'HR', 'BDE', 'TELESALES'), activityLogController.getMyActivityLogs);


router.get('/', authorize('SUPER_ADMIN'), activityLogController.getActivityLogs);


router.get('/user/:userId', authorize('SUPER_ADMIN', 'HR'), activityLogController.getUserActivityLogs);

module.exports = router;
