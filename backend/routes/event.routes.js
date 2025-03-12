const express = require('express');
const router = express.Router();
const eventController = require('../controlles/event.controller');

// Get all events
router.get('/', eventController.getEvents);

// Get single event by ID
router.get('/:id', eventController.getEventById);

module.exports = router;
