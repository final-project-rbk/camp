const express = require('express');
const router = express.Router();
const {
  migrateUserToAdvisor,
  getAllEvents,
  updateAdvisorProfile,
  addPlace,
  updatePlace,
  deletePlace,
  getAdvisorProfile,
  updatePoints,
  addEvent,
  updateEvent
} = require('../controlles/advisor.controller');

// Advisor management routes
router.post('/migrate-to-advisor', migrateUserToAdvisor);
router.get('/events', getAllEvents);
router.put('/advisor/:id', updateAdvisorProfile);
router.put('/event/:id', updateEvent);
router.post('/place', addPlace);
router.put('/place/:id', updatePlace);
router.delete('/place/:id', deletePlace);
router.get('/advisor/:id', getAdvisorProfile);
router.post('/points', updatePoints);
router.post('/event', addEvent);

module.exports = router;