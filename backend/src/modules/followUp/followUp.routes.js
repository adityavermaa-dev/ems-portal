const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth.middleware');
const authorize = require('../../middlewares/role.middleware');
const followUpController = require('./followUp.controller');

router.use(authMiddleware);


router.post('/', authorize('SUPER_ADMIN', 'HR', 'BDE', 'TELESALES'), followUpController.createFollowUp);


router.get('/upcoming', authorize('SUPER_ADMIN', 'HR', 'BDE', 'TELESALES'), followUpController.getUpcomingFollowUps);


router.get('/overdue', authorize('SUPER_ADMIN', 'HR', 'BDE', 'TELESALES'), followUpController.getOverdueFollowUps);


router.get('/lead/:leadId', authorize('SUPER_ADMIN', 'HR', 'BDE', 'TELESALES'), followUpController.getFollowUpsByLead);


router.get('/:id', authorize('SUPER_ADMIN', 'HR', 'BDE', 'TELESALES'), followUpController.getFollowUpById);

module.exports = router;
