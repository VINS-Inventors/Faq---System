const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const forumController = require('../controllers/forumController');

router.post('/', auth, forumController.postMessage);
router.get('/:queryId', forumController.getMessages);
router.put('/:id', auth, forumController.updateMessage);
router.delete('/:id', auth, forumController.deleteMessage);

module.exports = router;