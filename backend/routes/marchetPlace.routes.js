// routes/marketplace.routes.js
const express = require('express');
const router = express.Router();
const { 
  getAllItems, 
  getItemById,
  createItem, 
  buyItem, 
  getSellerProfile, 
  sendChatMessage, 
  getChatHistory,
  getItemsByCategory,
  searchItemByName,
  getAllMarketplaceCategories,
  createMarketplaceCategory,
  updateMarketplaceCategory,
  deleteMarketplaceCategory
} = require('../controlles/marcketPlace.controller');
// const authMiddleware = require('../middleware/auth'); // Assume you have this

// Item routes
router.get('/items', getAllItems);                    // Get all items
router.get('/items/:id', getItemById);               // Get single item by ID
router.post('/items', createItem);                    // Create a new item
router.put('/items/:id/buy', buyItem);               // Buy an item

// Category routes
router.get('/categories', getAllMarketplaceCategories);           // Get all marketplace categories
router.post('/categories', createMarketplaceCategory);           // Create new category
router.put('/categories/:id', updateMarketplaceCategory);        // Update category
router.delete('/categories/:id', deleteMarketplaceCategory);     // Delete category
router.get('/categories/:categoryId/items', getItemsByCategory); // Get items by category

// Item-Category relationship routes
    // Get categories for an item
// router.post('/items/:itemId/categories', addItemCategories);    // Add categories to an item
// router.delete('/items/:itemId/categories', removeItemCategories); // Remove categories from an item

// Search route
router.get('/search', searchItemByName);             // Search items with filters

// Seller route
router.get('/sellers/:sellerId', getSellerProfile);   // View seller profile

// Chat routes
router.post('/chat', sendChatMessage);               // Send a chat message
router.get('/chat/:itemId', getChatHistory);         // Get chat history

module.exports = router;