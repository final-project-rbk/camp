const express = require('express');
const router = express.Router();
const placeController = require('../controlles/Place.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Protect all place routes with authentication
router.use(authMiddleware);

// Admin routes
router.get('/admin', placeController.getAllPlacesAdmin);
router.put('/:id/status', placeController.updatePlaceStatus);

// Regular routes
router.get('/', placeController.getAllPlaces);

// Get place by ID
router.get('/:id', placeController.getPlaceById);

// Create new place
router.post('/', placeController.createPlace);

// Update place
router.put('/:id', placeController.updatePlace);

// Delete place
router.delete('/:id', placeController.deletePlaceById);

module.exports = router;
