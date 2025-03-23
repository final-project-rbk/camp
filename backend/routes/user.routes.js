const express = require('express');
const router = express.Router();
const userController = require('../controlles/user.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Protected routes
router.get('/:id', authMiddleware, userController.getUser);
router.put('/:id', authMiddleware, userController.updateUser);
router.put('/:id/location-permission', authMiddleware, userController.updateLocationPermission);

// Admin routes
router.get('/', authMiddleware, userController.getAllUsers); // Get all users
router.put('/:id/ban', authMiddleware, userController.toggleUserBan); // Ban/unban user
router.put('/:id/role', authMiddleware, userController.updateUserRole); // Update user role

module.exports = router; 