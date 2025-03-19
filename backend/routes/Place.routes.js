const express = require('express');
const router = express.Router();
const placeController = require('../controlles/Place.controller');

// Get all places
router.get('/', placeController.getAllPlaces);

// Get place by ID
router.get('/:id', placeController.getPlaceById);

// Rate a place (add star rating)
router.post('/rate', placeController.ratePlace);

// Get a user's rating for a place
router.get('/:id/user-rating/:userId', placeController.getUserPlaceRating);

module.exports = router;
