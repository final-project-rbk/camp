// routes/marketplace.routes.js
const express = require('express');
const router = express.Router();
const { 
  getAllItems, 
  createItem, 
  buyItem, 
  getSellerProfile, 
  sendChatMessage, 
  getChatHistory,
  getItemsByCategory,
  searchItemByName
} = require('../controlles/marcketPlace.controller');
// const authMiddleware = require('../middleware/auth'); // Assume you have this

router.get('/items', getAllItems); 
router.get('/category/:categoryId', getItemsByCategory)                  // List all available items
router.post('/items', createItem);   // Create a new item
router.put('/items/:id/buy',  buyItem); // Buy an item
router.get('/seller/:sellerId', getSellerProfile);   // View seller profile
router.post('/chat',  sendChatMessage); // Send a chat message
router.get('/chat/:itemId', getChatHistory); // Get chat history
router.get('/search', searchItemByName); // Add this new route

module.exports = router;