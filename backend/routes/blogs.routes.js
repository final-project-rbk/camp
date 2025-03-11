// routes/blogRoutes.js
const express = require('express');
const router = express.Router();
const blogController = require('../controlles/bolgs.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Public routes
router.get('/', blogController.getAllBlogs);
router.get('/:id', blogController.getBlogById);

// Protected routes
router.post('/', authMiddleware, blogController.createBlog);
router.put('/:id', authMiddleware, blogController.updateBlog);
router.delete('/:id', authMiddleware, blogController.deleteBlog);
router.post('/:id/comments', authMiddleware, blogController.addComment);
router.delete('/:blogId/comments/:commentId', authMiddleware, blogController.deleteComment);

// Comment routes
router.get('/comments/:blogid', blogController.getAllComments);
router.put('/comments/:commentId', blogController.updateComment);

// Like routes
router.post('/:id/like', blogController.toggleLike);

module.exports = router;