const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middlewares/auth.middleware');
const authorize = require('../../middlewares/role.middleware');
const leadController = require('./lead.controller');
const multer = require('multer');

const upload = multer({ dest: 'uploads/' });

router.use(authMiddleware);


router.post('/', authorize('SUPER_ADMIN', 'HR'), leadController.createLead);


router.post('/import', authorize('SUPER_ADMIN', 'HR'), upload.single('file'), leadController.importLeads);


router.get('/', authorize('SUPER_ADMIN', 'HR', 'BDE', 'TELESALES'), leadController.getLeads);


router.get('/:id', authorize('SUPER_ADMIN', 'HR', 'BDE', 'TELESALES'), leadController.getLeadById);


router.put('/:id', authorize('SUPER_ADMIN', 'HR', 'BDE', 'TELESALES'), leadController.updateLead);


router.patch('/:id/status', authorize('SUPER_ADMIN', 'HR', 'BDE', 'TELESALES'), leadController.updateLeadStatus);


router.patch('/:id/assign', authorize('SUPER_ADMIN', 'HR'), leadController.assignLead);

router.post('/:id/notes', authorize('SUPER_ADMIN', 'HR', 'BDE', 'TELESALES'), leadController.addNote);

router.get('/:id/notes', authorize('SUPER_ADMIN', 'HR', 'BDE', 'TELESALES'), leadController.getNotes);

module.exports = router;
