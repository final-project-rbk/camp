const express = require('express');
const router = express.Router();
const categorieController = require('../controlles/categorie');

router.get('/', categorieController.getAllCategories);
router.get('/:categoryName/places', categorieController.getPlacesByCategory);

module.exports = router;
