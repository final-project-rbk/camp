// routes/blogRoutes.js
const express = require('express');
const router = express.Router();
const blogController = require('../controlles/bolgs.controller');

// Blog routes
router.post('/', blogController.createBlog);
router.get('/', blogController.getAllBlogs);
router.get('/:id', blogController.getBlogById);
router.put('/:id', blogController.updateBlog);
router.delete('/:id', blogController.deleteBlog);

// Comment routes
router.post('/comments/:blogid', blogController.addComment);
router.delete('/comments/:commentId', blogController.deleteComment);

// Additional comment routes
router.get('/comments/:blogid', blogController.getAllComments);
router.put('/comments/:commentId', blogController.updateComment);

// Like routes
router.post('/:id/like', blogController.toggleLike);

module.exports = router;