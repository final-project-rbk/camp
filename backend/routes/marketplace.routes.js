const express = require('express');
const router = express.Router();
const marketplaceController = require('../controllers/marketplace.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Public routes
router.get('/items', marketplaceController.getAllItems);
router.get('/items/:id', marketplaceController.getItemById);
router.get('/categories/:categoryId/items', marketplaceController.getItemsByCategory);

// Protected routes
router.post('/items', authMiddleware, marketplaceController.createItem);
router.put('/items/:id', authMiddleware, marketplaceController.updateItem);
router.delete('/items/:id', authMiddleware, marketplaceController.deleteItem);
router.post('/items/:id/buy', authMiddleware, marketplaceController.buyItem);


module.exports = router; 