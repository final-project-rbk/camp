const express = require('express');
const router = express.Router();
const critiriaController = require('../controlles/critiria.controller');

router.get('/', critiriaController.getAllCritiria);
router.get('/:id', critiriaController.getCritiriaById);
router.get('/place/:placeId', critiriaController.getPlaceCritiria);

module.exports = router;
