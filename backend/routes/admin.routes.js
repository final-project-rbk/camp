const express = require('express');
const router = express.Router();
const adminController = require('../controlles/admin.controller');
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');

// Apply both authentication and admin check middlewares
router.use(authMiddleware);  // First check authentication
router.use(adminMiddleware); // Then check admin role

// Protected admin routes
router.get('/users', adminController.getAllUsers);
router.put('/users/:userId/ban', adminController.toggleUserBan);

// Advisor application routes
router.get('/advisor-applications', adminController.getAdvisorApplications);
router.put('/advisor-applications/:formularId', adminController.handleAdvisorApplication);

module.exports = router; 