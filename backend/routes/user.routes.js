const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
// const { authMiddleware } = require('../middleware/auth.middleware');

// Get single user
router.get('/:id', userController.getUser);

// Update user
router.put('/:id', userController.updateUser);

module.exports = router; 