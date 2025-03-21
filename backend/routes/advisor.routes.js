const express = require('express');
const router = express.Router();
const advisorController = require('../controlles/advisor.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Protected routes
router.post('/migrate', authMiddleware, advisorController.migrateUserToAdvisor);
router.get('/places', authMiddleware, advisorController.getAllPlaces);
router.get('/events', authMiddleware, advisorController.getAllEvents);
router.put('/profile/:id', authMiddleware, advisorController.updateAdvisorProfile);
router.put('/place/:id', authMiddleware, advisorController.updatePlace);
router.delete('/place/:id', authMiddleware, advisorController.deletePlace);
router.put('/event/:id', authMiddleware, advisorController.updateEvent);
router.delete('/event/:id', authMiddleware, advisorController.deleteEvent);
router.post('/place', authMiddleware, advisorController.addPlace);
router.post('/event', authMiddleware, advisorController.addEvent);
router.post('/points', authMiddleware, advisorController.updatePoints);
router.get('/:id', authMiddleware, advisorController.getAdvisorProfile);

// Get places by creator ID
router.get('/:id/places', authMiddleware, advisorController.getPlacesByCreator);

module.exports = router;