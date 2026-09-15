const express = require('express');
const router = express.Router();
const { loginUser, getMe } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/login', loginUser);
router.get('/me', authMiddleware, getMe);

module.exports = router;
