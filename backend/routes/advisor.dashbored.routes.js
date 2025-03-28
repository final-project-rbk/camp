const express = require('express');
const router = express.Router();
const advisorDashboardController = require('../controlles/advisor.dashbored.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Get places
router.get('/places/all', authMiddleware, advisorDashboardController.getAllPlaces);
router.get('/places/mine', authMiddleware, advisorDashboardController.getAdvisorPlaces);

// Place operations
router.post('/places', authMiddleware, advisorDashboardController.createPlace);
router.put('/places/:id', authMiddleware, advisorDashboardController.updatePlace);
router.delete('/places/:id', authMiddleware, advisorDashboardController.deletePlace);

// Get events
router.get('/events/all', authMiddleware, advisorDashboardController.getAllEvents);
router.get('/events/mine', authMiddleware, advisorDashboardController.getAdvisorEvents);

// Event operations
router.post('/events', authMiddleware, advisorDashboardController.createEvent);
router.put('/events/:id', authMiddleware, advisorDashboardController.updateEvent);
router.delete('/events/:id', authMiddleware, advisorDashboardController.deleteEvent);

// Get dashboard stats
router.get('/stats', authMiddleware, advisorDashboardController.getDashboardStats);

module.exports = router;
