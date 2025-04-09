// routes/blogRoutes.js
const express = require('express');
const router = express.Router();
const blogController = require('../controlles/bolgs.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Public routes
// router.get('/', blogController.getAllBlogs); // Remove or comment this line
// Add this route
router.get('/disabled', authMiddleware, blogController.getMyDisabledBlogs);
// Add this new route for admins to get all disabled blogs
router.get('/all-disabled', authMiddleware, blogController.getAllDisabledBlogs);

// Add this protected route instead:
router.get('/', authMiddleware, blogController.getAllBlogs);
router.get('/:id', authMiddleware, blogController.getBlogById);

// Protected routes
router.post('/', authMiddleware, blogController.createBlog);
router.put('/:id', authMiddleware, blogController.updateBlog);
router.delete('/:id', authMiddleware, blogController.deleteBlog);

// Comment routes
router.post('/:blogid/comments', authMiddleware, blogController.addComment);
router.get('/comments/:blogid', blogController.getAllComments);
router.put('/comments/:commentId', authMiddleware, blogController.updateComment);
router.put('/:blogId/comments/:commentId/disable', authMiddleware, blogController.disableComment);
router.put('/:blogId/comments/:commentId/enable', authMiddleware, blogController.enableComment);
router.get('/:blogId/comments/disabled', authMiddleware, blogController.getDisabledComments);

// Add this new route to handle the current frontend API call
router.post('/comments/:id/blogid', authMiddleware, blogController.addComment);

// Like routes
router.post('/:id/like', authMiddleware, blogController.toggleLike);

// Uncomment the disable/enable blog routes
router.put('/:id/disable', authMiddleware, blogController.disableBlog);
router.put('/:id/enable', authMiddleware, blogController.enableBlog);



module.exports = router;