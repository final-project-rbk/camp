const express = require('express');
const router = express.Router();
const { migrateUserToAdvisor, getAllPlaces, getAllEvents,updateAdvisorProfile,updatePlace,deletePlace,updateEvent,deleteEvent,addPlace,addEvent,getAdvisorProfile,updatePoints,getUpcomingEvents } = require('../controlles/advisor.controller');


router.get('/places', getAllPlaces);
router.get('/events', getAllEvents);
router.get('/events/upcoming', getUpcomingEvents);
router.put('/advisor/:id', updateAdvisorProfile);
router.put('/place/:id', updatePlace);
router.delete('/place/:id', deletePlace);
router.put('/event/:id', updateEvent);
router.delete('/event/:id', deleteEvent);
router.post('/place', addPlace);
router.post('/event', addEvent);
router.post('/migrate', migrateUserToAdvisor);
router.get('/advisor/:id', getAdvisorProfile);
router.post('/points', updatePoints);



module.exports = router;