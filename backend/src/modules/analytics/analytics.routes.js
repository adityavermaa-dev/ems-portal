const express = require('express');
const router = express.Router();
const analyticsController = require('./analytics.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const authorize = require('../../middlewares/role.middleware');


router.get('/', authMiddleware, authorize('SUPER_ADMIN', 'HR'), analyticsController.getAnalytics);

module.exports = router;
