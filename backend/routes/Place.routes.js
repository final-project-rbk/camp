const express = require('express');
const router = express.Router();
const placeController = require('../controlles/Place.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.get('/', placeController.getAllPlaces);
router.get('/:id', placeController.getPlaceById);
router.post('/', authMiddleware, placeController.createPlace);

module.exports = router;
