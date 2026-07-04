const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth.middleware');
const authorize = require('../../middlewares/role.middleware');
const salesTargetController = require('./salesTarget.controller');

router.use(authMiddleware);

// Employee routes
router.get('/dashboard-stats', salesTargetController.getDashboardStats);
router.get('/leaderboard', salesTargetController.getLeaderboard);

// HR / Admin routes
router.post('/', authorize('SUPER_ADMIN', 'HR'), salesTargetController.setTarget);
router.get('/', authorize('SUPER_ADMIN', 'HR'), salesTargetController.getAllTargets);

module.exports = router;
