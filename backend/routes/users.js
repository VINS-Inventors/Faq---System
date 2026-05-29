const express = require('express');
const router = express.Router();
const { getAllUsers } = require('../controllers/userController');
const { auth, adminOnly } = require('../middleware/auth');

router.get('/', auth, adminOnly, getAllUsers);

module.exports = router;