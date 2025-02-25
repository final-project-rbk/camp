// blogController.js

const { Blog } = require('../models/blog'); // Ensure correct model import

const blogController = {
    // Create a new blog post
    createBlog: async (req, res) => {
        try {
            const newBlog = await Blog.create({
                title: req.body.title,
                content: req.body.content,
                image: req.body.image,
                likes: req.body.likes || 0,
                comments: req.body.comments || []
            });
            res.status(201).json({ success: true, data: newBlog, message: 'Blog post created successfully' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message, message: 'Error creating blog post' });
        }
    },

    // Get all blog posts
    getAllBlogs: async (req, res) => {
        try {
            console.log(Blog,"blogggggggggggggggg");
            
            const blogs = await Blog.findAll();
            res.status(200).json({ success: true, data: blogs, message: 'Blogs retrieved successfully' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message, message: 'Error retrieving blogs' });
        }
    },

    // Get a single blog post by ID
    getBlogById: async (req, res) => {
        try {
            const blog = await Blog.findByPk(req.params.id);
            if (!blog) return res.status(404).json({ success: false, message: 'Blog post not found' });
            res.status(200).json({ success: true, data: blog, message: 'Blog retrieved successfully' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message, message: 'Error retrieving blog' });
        }
    },

    // Update a blog post
    updateBlog: async (req, res) => {
        try {
            const blog = await Blog.findByPk(req.params.id);
            if (!blog) return res.status(404).json({ success: false, message: 'Blog post not found' });
            await blog.update(req.body);
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
            await blog.destroy();
            res.status(200).json({ success: true, message: 'Blog post deleted successfully' });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message, message: 'Error deleting blog' });
        }
    }
};

module.exports = blogController;
