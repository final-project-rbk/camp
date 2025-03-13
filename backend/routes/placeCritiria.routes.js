const express = require('express');
const router = express.Router();
const placeCritiriaController = require('../controlles/placeCritiria.controller');

router.get('/place/:placeId', placeCritiriaController.getPlaceCriteria);
router.post('/vote', placeCritiriaController.voteCriteria);

module.exports = router; 