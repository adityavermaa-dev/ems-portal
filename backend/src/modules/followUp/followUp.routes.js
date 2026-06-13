const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth.middleware');
const authorize = require('../../middlewares/role.middleware');
const followUpController = require('./followUp.controller');

router.use(authMiddleware);

// Create follow-up
router.post('/', authorize('SUPER_ADMIN', 'HR', 'BDE', 'TELESALES'), followUpController.createFollowUp);

// Get upcoming follow-ups
router.get('/upcoming', authorize('SUPER_ADMIN', 'HR', 'BDE', 'TELESALES'), followUpController.getUpcomingFollowUps);

// Get follow-ups by lead
router.get('/lead/:leadId', authorize('SUPER_ADMIN', 'HR', 'BDE', 'TELESALES'), followUpController.getFollowUpsByLead);

// Get follow-up by ID
router.get('/:id', authorize('SUPER_ADMIN', 'HR', 'BDE', 'TELESALES'), followUpController.getFollowUpById);

module.exports = router;
