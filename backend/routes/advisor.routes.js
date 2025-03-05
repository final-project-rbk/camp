const express = require('express');
const router = express.Router();
const advisorController = require('../controlles/advisor.controller');

// Routes for places
router.get('/places', advisorController.getAllPlaces);
router.post('/place', advisorController.addPlace);
router.put('/place/:id', advisorController.updatePlace);
router.delete('/place/:id', advisorController.deletePlace);

// Routes for events
router.get('/events', advisorController.getAllEvents);
router.get('/events/upcoming', advisorController.getUpcomingEvents);
router.post('/event', advisorController.addEvent);
router.put('/event/:id', advisorController.updateEvent);
router.delete('/event/:id', advisorController.deleteEvent);

// Routes for advisor
router.post('/migrate', advisorController.migrateUserToAdvisor);
router.get('/advisor/:id', advisorController.getAdvisorProfile);
router.put('/advisor/:id', advisorController.updateAdvisorProfile);
router.post('/advisor/:id/profile-image', advisorController.updateProfileImage);

// Points route
router.post('/points', advisorController.updatePoints);

module.exports = router;