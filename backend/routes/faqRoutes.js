const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { adminOnly } = require('../middleware/auth');
const faqController = require('../controllers/faqController');

// Public
router.get('/', faqController.getAllFAQs);
router.get('/:id', faqController.getFAQById);
router.post('/:id/helpful', auth, faqController.markHelpful);

// Admin only
router.post('/', auth, adminOnly, faqController.createFAQ);
router.put('/:id', auth, adminOnly, faqController.updateFAQ);
router.delete('/:id', auth, adminOnly, faqController.deleteFAQ);

module.exports = router;