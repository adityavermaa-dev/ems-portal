const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth.middleware');
const authorize = require('../../middlewares/role.middleware');
const taskController = require('./task.controller');

router.use(authMiddleware);


router.post('/', authorize('SUPER_ADMIN', 'HR'), taskController.createTask);


router.get('/', authorize('SUPER_ADMIN', 'HR', 'BDE', 'TELESALES'), taskController.getTasks);


router.get('/:id', authorize('SUPER_ADMIN', 'HR', 'BDE', 'TELESALES'), taskController.getTaskById);


router.patch('/:id/status', authorize('SUPER_ADMIN', 'HR', 'BDE', 'TELESALES'), taskController.updateTaskStatus);


router.patch('/:id/overdue-reason', authorize('BDE', 'TELESALES'), taskController.submitOverdueReason);

module.exports = router;
