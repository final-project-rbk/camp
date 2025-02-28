const express = require('express');
const router = express.Router();
const placeController = require('../controlles/Place');

router.get('/', placeController.getAllPlaces);
router.get('/:id', placeController.getPlaceById);

module.exports = router;
