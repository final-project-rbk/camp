const express = require('express');
const router = express.Router();
const favoriteController = require('../controlles/Favorite.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Protected routes - require authentication
router.get('/user/:userId', authMiddleware, favoriteController.getUserFavorites);
router.post('/toggle', authMiddleware, favoriteController.toggleFavorite);

module.exports = router;
