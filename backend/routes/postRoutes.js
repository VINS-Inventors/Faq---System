const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const c = require('../controllers/postController');

router.get('/', c.getPosts);
router.get('/:id', c.getPost);
router.post('/', auth, c.createPost);
router.delete('/:id', auth, c.deletePost);
router.post('/:id/vote', auth, c.votePost);
router.post('/:id/answers', auth, c.addAnswer);
router.post('/:id/answers/:answerId/vote', auth, c.voteAnswer);
router.put('/:id/answers/:answerId', auth, c.editAnswer);
router.post('/:id/answers/:answerId/react', auth, c.reactAnswer);
router.post('/:id/answers/:answerId/accept', auth, c.acceptAnswer);
router.delete('/:id/answers/:answerId', auth, c.deleteAnswer);

module.exports = router;
