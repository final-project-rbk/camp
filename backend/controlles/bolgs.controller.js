const { Blog, Comment, User } = require('../models');

const blogController = {
    // Create a new blog post
    createBlog: async (req, res) => {
        try {
            const newBlog = await Blog.create({
                title: req.body.title,
                content: req.body.content,
                image: req.body.image,
                likes: req.body.likes || 0,
                userId: req.body.userId // Add userId for blog ownership
            });
            res.status(201).json({ success: true, data: newBlog, message: 'Blog post created successfully' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message, message: 'Error creating blog post' });
        }
    },

    // Get all blog posts with their comments
    getAllBlogs: async (req, res) => {
        try {
            const blogs = await Blog.findAll({
                include: [
                    {
                        model: User,
                        attributes: ['first_name', 'last_name', 'profile_image'] // Updated to include all three fields
                    },
                    {
                        model: Comment,
                        include: [
                            {
                                model: User,
                                attributes: ['first_name', 'last_name', 'profile_image'] // Updated to include all three fields
                            }
                        ]
                    }
                ]
            });
            res.status(200).json({ success: true, data: blogs, message: 'Blogs retrieved successfully' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message, message: 'Error retrieving blogs' });
        }
    },
    

    // Get a single blog post by ID with comments
    getBlogById: async (req, res) => {
        try {
            const blog = await Blog.findByPk(req.params.id, {
                include: [
                    {
                        model: User,
                        attributes: ['first_name', 'last_name', 'profile_image']
                    },
                    {
                        model: Comment,
                        include: [{
                            model: User,
                            attributes: ['first_name', 'last_name', 'profile_image']
                        }]
                    }
                ]
            });
            if (!blog) return res.status(404).json({ success: false, message: 'Blog post not found' });
            res.status(200).json({ success: true, data: blog, message: 'Blog retrieved successfully' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message, message: 'Error retrieving blog' });
        }
    },

    // Add a comment to a blog
    addComment: async (req, res) => {
        try {
            // Log all parameters to debug
            console.log('Request parameters:', {
                params: req.params,
                body: req.body,
                query: req.query
            });
            
            // Extract blogId from various possible locations
            const blogId = req.params.blogId || req.params.id || req.params.blogid || req.body.blogId;
            
            if (!blogId) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Blog ID is required',
                    debug: { params: req.params, body: req.body }
                });
            }   
            
            console.log('Looking for blog with ID:', blogId);
            
            const blog = await Blog.findByPk(blogId);
            if (!blog) {
                console.log('Blog not found with ID:', blogId);
                return res.status(404).json({ success: false, message: 'Blog post not found' });
            }
        
            const newComment = await Comment.create({
                content: req.body.content,
                userId: req.body.userId,
                blogId: blogId
            });
            
            console.log('New Comment created:', newComment.toJSON());
        
            const commentWithUser = await Comment.findByPk(newComment.id, {
                include: [{
                    model: User,
                    attributes: ['first_name', 'last_name', 'profile_image']
                }]
            });
        
            res.status(201).json({ 
                success: true, 
                data: commentWithUser, 
                message: 'Comment added successfully' 
            });
        } catch (error) {
            console.error('Error adding comment:', error);
            res.status(500).json({ 
                success: false, 
                error: error.message, 
                message: 'Error adding comment' 
            });
        }
    },

    // Delete a comment
    deleteComment: async (req, res) => {
        try {
            const { commentId } = req.params;
            const userId = req.user.id; // Assuming your auth middleware adds user to req
            
            const comment = await Comment.findByPk(commentId);
            if (!comment) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Comment not found' 
                });
            }
            
            // Check if the current user is the owner of the comment
            if (comment.userId !== userId) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'You are not authorized to delete this comment' 
                });
            }
            
            await comment.destroy();
            res.status(200).json({ success: true, message: 'Comment deleted successfully' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message, message: 'Error deleting comment' });
        }
    },

    // Update a blog post
    updateBlog: async (req, res) => {
        try {
            const blog = await Blog.findByPk(req.params.id);
            if (!blog) return res.status(404).json({ success: false, message: 'Blog post not found' });
            
            await blog.update({
                title: req.body.title,
                content: req.body.content,
                image: req.body.image,
                likes: req.body.likes
            });
            
            res.status(200).json({ success: true, data: blog, message: 'Blog post updated successfully' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message, message: 'Error updating blog' });
        }
    },

    // Delete a blog post
    deleteBlog: async (req, res) => {
        try {
            const blog = await Blog.findByPk(req.params.id);
            if (!blog) return res.status(404).json({ success: false, message: 'Blog post not found' });
            
            // This will also delete associated comments due to cascade delete in the model
            await blog.destroy();
            res.status(200).json({ success: true, message: 'Blog post deleted successfully' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message, message: 'Error deleting blog' });
        }
    },

    // Get all comments for a specific blog
    getAllComments: async (req, res) => {
        try {
            console.log('req.params:', req.params); // Keep this for debugging
            const comments = await Comment.findAll({
                where: {
                    blogId: req.params.blogid
                },
                include: [{
                    model: User,
                    attributes: ['first_name', 'last_name', 'profile_image'] // Added profile_image
                }]
            });
            res.status(200).json({ 
                success: true, 
                data: comments, 
                message: 'Comments retrieved successfully' 
            });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                error: error.message, 
                message: 'Error retrieving comments' 
            });
        }
    },

    // Update a comment
    updateComment: async (req, res) => {
        try {
            const { commentId } = req.params;
            const userId = req.user.id; // Assuming your auth middleware adds user to req
            
            const comment = await Comment.findByPk(commentId);
            if (!comment) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Comment not found' 
                });
            }
            
            // Check if the current user is the owner of the comment
            if (comment.userId !== userId) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'You are not authorized to update this comment' 
                });
            }

            await comment.update({
                content: req.body.content
            });

            const updatedComment = await Comment.findByPk(comment.id, {
                include: [{
                    model: User,
                    attributes: ['first_name', 'last_name', 'profile_image']
                }]
            });

            res.status(200).json({ 
                success: true, 
                data: updatedComment, 
                message: 'Comment updated successfully' 
            });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                error: error.message, 
                message: 'Error updating comment' 
            });
        }
    },

    // Add this new method for handling likes
    toggleLike: async (req, res) => {
        try {
            const { id } = req.params;
            const { userId, liked } = req.body;

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: 'User ID is required'
                });
            }

            // Check if blog exists
            const blog = await Blog.findByPk(id);
            if (!blog) {
                return res.status(404).json({
                    success: false,
                    message: 'Blog not found'
                });
            }

            // Update likes count based on the action
            const currentLikes = blog.likes || 0;
            const newLikes = liked ? currentLikes + 1 : Math.max(0, currentLikes - 1);

            // Update blog's like count
            await blog.update({ likes: newLikes });

            res.json({
                success: true,
                data: {
                    likes: newLikes,
                    liked: liked
                },
                message: liked ? 'Blog liked successfully' : 'Blog unliked successfully'
            });

        } catch (error) {
            console.error('Error handling like:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Error updating like status'
            });
        }
    }
};

module.exports = blogController; 