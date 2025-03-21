const express = require('express');
const router = express.Router();
const placeController = require('../controlles/Place.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Get all places
router.get('/', placeController.getAllPlaces);

// Get place by ID
router.get('/:id', placeController.getPlaceById);

// Create new place
router.post('/', authMiddleware, placeController.createPlace);

// Update place status (approve/reject)
router.put('/:id/status', authMiddleware, placeController.updatePlaceStatus);

// Rate a place (add star rating)
router.post('/rate', placeController.ratePlace);

// Get a user's rating for a place
router.get('/:id/user-rating/:userId', placeController.getUserPlaceRating);

module.exports = router;
