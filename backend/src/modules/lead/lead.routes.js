const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth.middleware');
const authorize = require('../../middlewares/role.middleware');
const leadController = require('./lead.controller');

router.use(authMiddleware);

// Create lead - SUPER_ADMIN, HR only
router.post('/', authorize('SUPER_ADMIN', 'HR'), leadController.createLead);

// Get all leads - All authenticated (filtered by role in service)
router.get('/', authorize('SUPER_ADMIN', 'HR', 'BDE', 'TELESALES'), leadController.getLeads);

// Get lead by ID
router.get('/:id', authorize('SUPER_ADMIN', 'HR', 'BDE', 'TELESALES'), leadController.getLeadById);

// Update lead
router.put('/:id', authorize('SUPER_ADMIN', 'HR', 'BDE', 'TELESALES'), leadController.updateLead);

// Update lead status independently
router.patch('/:id/status', authorize('SUPER_ADMIN', 'HR', 'BDE', 'TELESALES'), leadController.updateLeadStatus);

// Assign lead - SUPER_ADMIN, HR only
router.patch('/:id/assign', authorize('SUPER_ADMIN', 'HR'), leadController.assignLead);

module.exports = router;
