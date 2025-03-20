const express = require('express');
const router = express.Router();
const adminController = require('../controlles/admin.controller');
const { isAdmin } = require('../middleware/auth.middleware'); // You'll need to create this middleware
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');

// User management routes
router.get('/users', adminController.getAllUsers);
router.put('/users/:userId/ban', adminController.toggleUserBan);

// Advisor application routes
router.get('/advisor-applications', adminController.getAdvisorApplications);
router.put('/advisor-applications/:formularId', adminController.handleAdvisorApplication);

// Protected admin routes - requires both authentication and admin role
router.post('/place', authMiddleware, adminMiddleware, adminController.createPlace);

module.exports = router; 