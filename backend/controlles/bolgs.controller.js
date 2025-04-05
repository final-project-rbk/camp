const { Blog, Comment, User, BlogLike, sequelize } = require('../models');
const { Op } = require('sequelize');

const blogController = {
    // Create a new blog post
    createBlog: async (req, res) => {
        try {
            const newBlog = await Blog.create({
                title: req.body.title,
                content: req.body.content,
                image: req.body.image,
                userId: req.body.userId // Add userId for blog ownership
            });
            res.status(201).json({ success: true, data: newBlog, message: 'Blog post created successfully' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message, message: 'Error creating blog post' });
        }
    },

    // Get all blog posts with their comments and like counts
    getAllBlogs: async (req, res) => {
        try {
            console.log('Fetching all blogs...');
            console.log('Request user:', req.user); // Log the user
            
            // Get the userId from the token if available
            const userId = req.user ? req.user.id : null;
            const isAdmin = req.user && req.user.role === 'admin';
            console.log(`User ID from token: ${userId}, Is admin: ${isAdmin}`);
            
            // First get all blogs with their relationships - SPECIFY EXACT ATTRIBUTES to exclude disabled
            const blogs = await Blog.findAll({
                attributes: ['id', 'title', 'content', 'image', 'userId', 'createdAt', 'updatedAt'], // Explicitly list attributes, excluding disabled
                include: [
                    {
                        model: User,
                        attributes: ['id', 'first_name', 'last_name', 'profile_image']
                    },
                    {
                        model: Comment,
                        include: [
                            {
                                model: User,
                                attributes: ['id', 'first_name', 'last_name']
                            }
                        ]
                    },
                    {
                        model: User,
                        as: 'likedBy',
                        attributes: ['id'],
                        through: { attributes: [] }
                    }
                ],
                order: [['createdAt', 'DESC']],
                where: {
                    disabled: false
                }
            });
            
            console.log(`Found ${blogs.length} blogs`);
            
            // Process each blog to add likes count and user's like status
            const processedBlogs = await Promise.all(blogs.map(async (blog) => {
                const blogJson = blog.toJSON();
                
                // Get total likes count for this blog
                const likesCount = await BlogLike.count({
                    where: { blogId: blog.id }
                });
                
                blogJson.likes = likesCount;
                
                // Add disabled property manually (since it's expected by frontend)
                blogJson.disabled = false;
                
                // Check if the current user has liked this blog
                if (userId) {
                    console.log(`Checking if user ${userId} liked blog ${blog.id}`);
                    const userLike = await BlogLike.findOne({
                        where: {
                            blogId: blog.id,
                            userId: userId
                        }
                    });
                    
                    // Add the liked status to the blog data
                    blogJson.liked = !!userLike;
                    console.log(`Blog ${blog.id} liked by user ${userId}: ${blogJson.liked}`);
                } else {
                    blogJson.liked = false;
                }
                
                return blogJson;
            }));
            
            res.status(200).json({ 
                success: true, 
                data: processedBlogs,
                message: 'Blogs retrieved successfully'
            });
        } catch (error) {
            console.error('Error in getAllBlogs:', error);
            res.status(500).json({ 
                success: false, 
                error: error.message, 
                message: 'Error retrieving blogs' 
            });
        }
    },
    

    // Get a single blog post by ID with comments
    getBlogById: async (req, res) => {
        try {
            const blog = await Blog.findByPk(req.params.id, {
                attributes: ['id', 'title', 'content', 'image', 'userId', 'createdAt', 'updatedAt'], // Explicitly list attributes
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
                    },
                    {
                        model: User,
                        as: 'likedBy',
                        attributes: ['id'],
                        through: { attributes: [] }
                    }
                ]
            });

            if (!blog) return res.status(404).json({ success: false, message: 'Blog post not found' });

            // Calculate likes count
            const likesCount = await BlogLike.count({
                where: { blogId: req.params.id }
            });

            // Check if requesting user has liked this blog
            let userLiked = false;
            if (req.user) {
                const like = await BlogLike.findOne({
                    where: { 
                        blogId: req.params.id, 
                        userId: req.user.id 
                    }
                });
                userLiked = !!like;
            }

            const blogData = blog.toJSON();
            blogData.likes = likesCount;
            blogData.liked = userLiked;
            blogData.disabled = false; // Add disabled property manually
            delete blogData.likedBy; // Clean up response

            res.status(200).json({ 
                success: true, 
                data: blogData, 
                message: 'Blog retrieved successfully' 
            });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                error: error.message, 
                message: 'Error retrieving blog' 
            });
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

    // Disable a comment
    disableComment: async (req, res) => {
        try {
            const { commentId } = req.params;
            const userId = req.user.id;
            
            console.log('Attempting to disable comment ID:', commentId);
            console.log('User:', req.user);
            
            const comment = await Comment.findByPk(commentId);
            if (!comment) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Comment not found' 
                });
            }
            
            // Check if the current user is the owner of the comment or an admin
            if (comment.userId !== userId && req.user.role !== 'admin') {
                return res.status(403).json({ 
                    success: false, 
                    message: 'You are not authorized to disable this comment' 
                });
            }
            
            // Update the disabled field instead of destroying
            await comment.update({ disabled: true });
            
            res.status(200).json({ 
                success: true, 
                message: 'Comment disabled successfully',
                data: comment 
            });
        } catch (error) {
            console.error('Error disabling comment:', error);
            res.status(500).json({ 
                success: false, 
                error: error.message, 
                message: 'Error disabling comment' 
            });
        }
    },

    // Enable a comment
    enableComment: async (req, res) => {
        try {
            const { commentId } = req.params;
            const userId = req.user.id;
            
            console.log('Attempting to enable comment ID:', commentId);
            console.log('User:', req.user);
            
            const comment = await Comment.findByPk(commentId);
            if (!comment) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Comment not found' 
                });
            }
            
            // Check if the current user is the owner of the comment or an admin
            if (comment.userId !== userId && req.user.role !== 'admin') {
                return res.status(403).json({ 
                    success: false, 
                    message: 'You are not authorized to enable this comment' 
                });
            }
            
            // Update the disabled field
            await comment.update({ disabled: false });
            
            res.status(200).json({ 
                success: true, 
                message: 'Comment enabled successfully',
                data: comment 
            });
        } catch (error) {
            console.error('Error enabling comment:', error);
            res.status(500).json({ 
                success: false, 
                error: error.message, 
                message: 'Error enabling comment' 
            });
        }
    },

    // Get all comments for a specific blog
    getAllComments: async (req, res) => {
        try {
            console.log('req.params:', req.params);
            
            // Check if we want to include disabled comments
            const includeDisabled = req.query.includeDisabled === 'true';
            
            // Build the where clause
            const whereClause = {
                blogId: req.params.blogid
            };
            
            // Only add disabled: false if we don't want to include disabled comments
            if (!includeDisabled) {
                whereClause.disabled = false;
            }
            
            const comments = await Comment.findAll({
                where: whereClause,
                include: [{
                    model: User,
                    attributes: ['first_name', 'last_name', 'profile_image']
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

    // Get only disabled comments for a specific blog
    getDisabledComments: async (req, res) => {
        try {
            const { blogid } = req.params;
            
            const comments = await Comment.findAll({
                where: {
                    blogId: blogid,
                    disabled: true
                },
                include: [{
                    model: User,
                    attributes: ['first_name', 'last_name', 'profile_image']
                }]
            });
            
            res.status(200).json({
                success: true,
                data: comments,
                message: 'Disabled comments retrieved successfully'
            });
        } catch (error) {
            console.error('Error getting disabled comments:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Error retrieving disabled comments'
            });
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

    // Toggle like for a blog post
    toggleLike: async (req, res) => {
        try {
            const blogId = req.params.id;
            const userId = req.user.id;
            
            // First check if the blog exists, but avoid selecting 'disabled' column
            const blog = await Blog.findByPk(blogId, {
                attributes: ['id', 'title', 'content', 'image', 'userId', 'createdAt', 'updatedAt']
            });
            
            if (!blog) {
                return res.status(404).json({
                    success: false,
                    message: 'Blog not found'
                });
            }
            
            // Check if user already liked the blog
            const existingLike = await BlogLike.findOne({
                where: {
                    blogId,
                    userId
                }
            });
            
            let action;
            
            if (existingLike) {
                // User already liked the blog, so unlike it
                await existingLike.destroy();
                action = 'unliked';
            } else {
                // User hasn't liked the blog, so like it
                await BlogLike.create({
                    blogId,
                    userId
                });
                action = 'liked';
            }
            
            // Get updated likes count
            const likesCount = await BlogLike.count({
                where: { blogId }
            });
            
            res.json({
                success: true,
                data: {
                    action,
                    likesCount,
                    liked: action === 'liked'
                },
                message: `Blog ${action} successfully`
            });
        } catch (error) {
            console.error('Error handling like:', error);
            res.status(500).json({
                success: false,
                error: error.message,
                message: 'Error updating like status'
            });
        }
    },

    // Disable a blog post
    disableBlog: async (req, res) => {
        try {
            console.log('Attempting to disable blog ID:', req.params.id);
            console.log('User:', req.user);
            
            // Find the blog with all columns (including disabled)
            const blog = await Blog.findByPk(req.params.id);
            
            if (!blog) {
                console.log('Blog not found');
                return res.status(404).json({ success: false, message: 'Blog not found' });
            }
            
            console.log('Current blog state:', blog.toJSON());
            
            // Check if user is authorized (either the owner or an admin)
            if (blog.userId !== req.user.id && req.user.role !== 'admin') {
                console.log('Authorization failed - user:', req.user.id, 'blog owner:', blog.userId);
                return res.status(403).json({ success: false, message: 'Not authorized to disable this blog' });
            }
            
            // Update the disabled field
            try {
                console.log('Attempting to update blog disabled status to true');
                await blog.update({ disabled: true });
                console.log('Blog disabled successfully');
            } catch (updateError) {
                console.error('Error updating blog disabled field:', updateError);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error updating blog disabled status',
                    error: updateError.message 
                });
            }
            
            res.status(200).json({ 
                success: true, 
                message: 'Blog disabled successfully',
                data: blog
            });
        } catch (error) {
            console.error('Error disabling blog:', error);
            res.status(500).json({ 
                success: false, 
                error: error.message, 
                message: 'Error disabling blog' 
            });
        }
    },

    // Enable a blog post - with improved logging
    enableBlog: async (req, res) => {
        try {
            console.log('Attempting to enable blog ID:', req.params.id);
            
            const blog = await Blog.findByPk(req.params.id);
            
            if (!blog) {
                console.log('Blog not found');
                return res.status(404).json({ success: false, message: 'Blog not found' });
            }
            
            console.log('Current blog state:', blog.toJSON());
            
            // Check if user is authorized (either the owner or an admin)
            if (blog.userId !== req.user.id && req.user.role !== 'admin') {
                console.log('Authorization failed - user:', req.user.id, 'blog owner:', blog.userId);
                return res.status(403).json({ success: false, message: 'Not authorized to enable this blog' });
            }
            
            // Update the disabled field
            try {
                console.log('Attempting to update blog disabled status to false');
                await blog.update({ disabled: false });
                console.log('Blog enabled successfully');
            } catch (updateError) {
                console.error('Error updating blog disabled field:', updateError);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error updating blog disabled status',
                    error: updateError.message 
                });
            }
            
            res.status(200).json({ 
                success: true, 
                message: 'Blog enabled successfully',
                data: blog
            });
        } catch (error) {
            console.error('Error enabling blog:', error);
            res.status(500).json({ 
                success: false, 
                error: error.message, 
                message: 'Error enabling blog' 
            });
        }
    },

    // Get all disabled blogs for the current user
    getMyDisabledBlogs: async (req, res) => {
        try {
            console.log('=== getMyDisabledBlogs called ===');
            const userId = req.user.id;
            
            console.log(`Fetching disabled blogs for user ID: ${userId}`);
            
            // Check that our models are correctly imported
            if (!Blog) {
                console.error('Blog model is not defined');
                return res.status(500).json({
                    success: false,
                    message: 'Blog model not found'
                });
            }
            
            // Use raw query for debugging
            const disabledBlogs = await Blog.findAll({
                where: {
                    userId: userId,
                    disabled: true
                },
                order: [['createdAt', 'DESC']],
                include: [
                    {
                        model: User,
                        attributes: ['first_name', 'last_name', 'profile_image']
                    }
                ]
            });

            console.log(`Found ${disabledBlogs.length} disabled blogs`);
            
            // Format the response with minimal processing to avoid errors
            const formattedBlogs = disabledBlogs.map(blog => {
                const blogData = blog.toJSON();
                return {
                    ...blogData,
                    likes: 0,  // Default values since we're not including likes here
                    liked: false
                };
            });
            
            return res.status(200).json({
                success: true,
                data: formattedBlogs,
                message: 'Disabled blogs retrieved successfully'
            });
        } catch (error) {
            console.error('Error retrieving disabled blogs:', error);
            return res.status(500).json({
                success: false,
                error: error.message,
                message: 'Error retrieving disabled blogs'
            });
        }
    },

    // Get all disabled blogs for admins
    getAllDisabledBlogs: async (req, res) => {
        try {
            console.log('Checking admin status for all-disabled blogs endpoint');
            console.log('User data:', req.user);
            
            // Check if user is admin by role OR by ID (temporary solution)
            // You can add specific admin user IDs here
            const adminUserIds = [1]; // Add your admin user IDs here
            const isAdmin = req.user.role === 'admin' || adminUserIds.includes(req.user.id);
            
            if (!isAdmin) {
                console.log('Access denied - User is not an admin');
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Admin privileges required.'
                });
            }

            console.log('Admin check passed, fetching all disabled blogs...');
            
            // Get all disabled blogs
            const disabledBlogs = await Blog.findAll({
                where: {
                    disabled: true
                },
                order: [['createdAt', 'DESC']],
                include: [
                    {
                        model: User,
                        attributes: ['id', 'first_name', 'last_name', 'profile_image']
                    },
                    {
                        model: Comment,
                        include: [
                            {
                                model: User,
                                attributes: ['id', 'first_name', 'last_name']
                            }
                        ]
                    }
                ]
            });

            console.log(`Found ${disabledBlogs.length} disabled blogs`);
            
            // Process each blog to add likes count
            const processedBlogs = await Promise.all(disabledBlogs.map(async (blog) => {
                const blogJson = blog.toJSON();
                
                // Get total likes count for this blog
                const likesCount = await BlogLike.count({
                    where: { blogId: blog.id }
                });
                
                blogJson.likes = likesCount;
                blogJson.liked = false;
                
                return blogJson;
            }));
            
            return res.status(200).json({
                success: true,
                data: processedBlogs,
                message: 'All disabled blogs retrieved successfully'
            });
        } catch (error) {
            console.error('Error retrieving all disabled blogs:', error);
            return res.status(500).json({
                success: false,
                error: error.message,
                message: 'Error retrieving all disabled blogs'
            });
        }
    },
};

module.exports = blogController; 