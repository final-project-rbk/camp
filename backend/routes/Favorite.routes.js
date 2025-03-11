const express = require('express');
const router = express.Router();
const favoriteController = require('../controlles/Favorite.controller');

router.get('/user/:userId', favoriteController.getUserFavorites);
router.post('/toggle', favoriteController.toggleFavorite);

module.exports = router;
