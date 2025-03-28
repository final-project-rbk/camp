const express = require('express');
const router = express.Router();
const advisorController = require('../controlles/advisor.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Get advisor profile
router.get('/advisor/:id', authMiddleware, advisorController.getAdvisorProfile);

// Update advisor profile
router.put('/profile/:id', authMiddleware, advisorController.updateAdvisorProfile);

// Get advisor stats
router.get('/stats/:id', authMiddleware, advisorController.getAdvisorStats);

// Update advisor experience
router.put('/experience/:id', authMiddleware, advisorController.updateAdvisorExperience);

module.exports = router;
