const express = require('express');
const router = express.Router();
const adminPlaceController = require('../controlles/admin.place.controller');
const authMiddleware = require('../middleware/auth.middleware');
const adminMiddleware = require('../middleware/admin.middleware');

// Apply auth and admin middleware to all routes
router.use(authMiddleware, adminMiddleware);

// Place management routes
router.get('/places', adminPlaceController.getAllPlaces);
router.post('/places/create', adminPlaceController.createPlace);
router.put('/places/:id', adminPlaceController.updatePlace);
router.put('/places/:id/status', adminPlaceController.updatePlaceStatus);
router.delete('/places/:id', adminPlaceController.deletePlace);

module.exports = router;
