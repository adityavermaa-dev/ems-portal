const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth.middleware');
const authorize = require('../../middlewares/role.middleware');
const taskController = require('./task.controller');

router.use(authMiddleware);

// Create task - SUPER_ADMIN, HR only
router.post('/', authorize('SUPER_ADMIN', 'HR'), taskController.createTask);

// Get all tasks (filtered by role in service)
router.get('/', authorize('SUPER_ADMIN', 'HR', 'BDE', 'TELESALES'), taskController.getTasks);

// Get task by ID
router.get('/:id', authorize('SUPER_ADMIN', 'HR', 'BDE', 'TELESALES'), taskController.getTaskById);

// Update task status
router.patch('/:id/status', authorize('SUPER_ADMIN', 'HR', 'BDE', 'TELESALES'), taskController.updateTaskStatus);

// Submit overdue reason
router.patch('/:id/overdue-reason', authorize('BDE', 'TELESALES'), taskController.submitOverdueReason);

module.exports = router;
