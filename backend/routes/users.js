const express = require('express');
const router = express.Router();
const { getAllUsers, deleteUser } = require('../controllers/userController');
const { auth, adminOnly } = require('../middleware/auth');

router.get('/', auth, adminOnly, getAllUsers);
router.delete('/:id', auth, adminOnly, deleteUser);

module.exports = router;