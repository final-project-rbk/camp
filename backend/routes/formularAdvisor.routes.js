const express = require('express');
const router = express.Router();
const formularAdvisorController = require('../controlles/formularAdvisorController');
const authMiddleware = require('../middleware/auth.middleware');

// Protected routes with authentication
router.use(authMiddleware);

// Create new advisor application
router.post('/create', formularAdvisorController.create);

// Get advisor application by user ID
router.get('/user/:userId', formularAdvisorController.getByUserId);

// Update advisor application
router.put('/:id', formularAdvisorController.update);

// Get all advisor applications (admin only)
router.get('/', formularAdvisorController.getAll);

// Update advisor application status
router.put('/:id/status', formularAdvisorController.updateStatus);

module.exports = router; 