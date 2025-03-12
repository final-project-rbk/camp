const express = require('express');
const router = express.Router();
const authController = require('../controlles/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');
const userController = require('../controlles/user.controller');

router.post('/signup', authController.signup);
router.post('/login', authController.login);

// Protected route example
router.get('/profile', authMiddleware, userController.getProfile);

module.exports = router; 