const express = require('express');
const router = express.Router();
const placeController = require('../controlles/Place.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.get('/', placeController.getAllPlaces);
router.get('/:id', placeController.getPlaceById);

// New routes
router.post('/', authMiddleware, placeController.createPlace);
router.put('/:id', authMiddleware, placeController.updatePlace);
router.delete('/:id', authMiddleware, placeController.deletePlace);
router.put('/:id/status', authMiddleware, placeController.updatePlaceStatus);
// router.get('/filter/status', authMiddleware, placeController.getPlacesByStatus);
router.get('/admin/places', placeController.getAllPlacesAdmin);
router.get('/admin/places/filter', placeController.getPlacesByStatusAdmin);
module.exports = router;
