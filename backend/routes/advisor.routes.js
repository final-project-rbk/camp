const express = require('express');
const router = express.Router();
const { migrateUserToAdvisor, getAllPlaces, getAllEvents,updateAdvisorProfile,updatePlace,deletePlace,updateEvent,deleteEvent,addPlace,addEvent,getAdvisorProfile,updatePoints } = require('../controlles/advisor.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Protected routes
router.post('/migrate', authMiddleware, migrateUserToAdvisor);
router.get('/places', authMiddleware, getAllPlaces);
router.get('/events', authMiddleware, getAllEvents);
router.put('/profile/:id', authMiddleware, updateAdvisorProfile);
router.put('/place/:id', authMiddleware, updatePlace);
router.delete('/place/:id', authMiddleware, deletePlace);
router.put('/event/:id', authMiddleware, updateEvent);
router.delete('/event/:id', authMiddleware, deleteEvent);
router.post('/place', authMiddleware, addPlace);
router.post('/event', authMiddleware, addEvent);
router.post('/points', authMiddleware, updatePoints);
router.get('/advisor/:id', authMiddleware, getAdvisorProfile);

module.exports = router;