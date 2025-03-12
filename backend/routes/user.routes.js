const express = require('express');
const router = express.Router();
const userController = require('../controlles/user.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Protected routes
router.get('/:id', authMiddleware, userController.getUser);
router.put('/:id', authMiddleware, userController.updateUser);

// Admin routes
router.get('/', authMiddleware, userController.getAllUsers); // Get all users
router.put('/:id/ban', authMiddleware, userController.toggleUserBan); // Ban/unban user

module.exports = router; 