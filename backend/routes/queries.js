const express = require('express');
const router = express.Router();
const { auth, adminOnly } = require('../middleware/auth');
const queryController = require('../controllers/queryController');

// Public board (resolved/approved FAQs)
router.get('/board', queryController.getBoard);

// User: own queries
router.get('/mine', auth, queryController.getMyQueries);

// Single query detail
router.get('/:id', queryController.getQueryById);

// User votes helpful / not helpful on query
router.post('/:id/helpful', auth, queryController.markHelpful);

// User submits a query
router.post('/', auth, queryController.submitQuery);

// Moderator claims a pending query → REVIEWING
router.put('/:id/claim', auth, adminOnly, queryController.claimQuery);

// Moderator resolves a reviewing query
router.put('/:id/resolve', auth, adminOnly, queryController.resolveQuery);

// Admin: escalate
router.put('/:id/escalate', auth, adminOnly, queryController.escalateQuery);

// Admin: approve a resolved query → creates FAQ
router.put('/:id/approve', auth, adminOnly, queryController.approveQuery);

// Admin: reject any query
router.put('/:id/reject', auth, adminOnly, queryController.rejectQuery);

// Admin: pending queue
router.get('/admin/pending', auth, adminOnly, queryController.getPending);

// Admin: escalated queue
router.get('/admin/escalated', auth, adminOnly, queryController.getEscalated);

// Admin/Moderator: reviewing queue — restricted to admin role
router.get('/admin/reviewing', auth, adminOnly, queryController.getReviewing);

module.exports = router;