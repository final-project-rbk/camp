const { Hint } = require('../models');

const hintController = {
    // Create a single hint
    createHint: async (req, res) => {
        try {
            const { title, description, difficulty, timeToComplete, image, gallerySteps, category } = req.body;

            // Validate required fields
            if (!title || !description || !difficulty || !timeToComplete || !category) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields. Title, description, difficulty, timeToComplete, and category are required.'
                });
            }

            // Create the hint
            const hint = await Hint.create({
                title,
                description,
                difficulty,
                timeToComplete,
                image,
                gallerySteps,
                category
            });

            res.status(201).json({
                success: true,
                message: 'Hint created successfully',
                data: hint
            });
        } catch (error) {
            console.error('Error creating hint:', error);
            res.status(500).json({
                success: false,
                error: 'Error creating hint'
            });
        }
    },

    // Get all hints
    getAllHints: async (req, res) => {
        try {
            const hints = await Hint.findAll({
                order: [['createdAt', 'DESC']]
            });
            res.status(200).json({
                success: true,
                data: hints
            });
        } catch (error) {
            console.error('Error fetching hints:', error);
            res.status(500).json({
                success: false,
                error: 'Error fetching hints'
            });
        }
    },

    // Get single hint
    getHintById: async (req, res) => {
        try {
            const hint = await Hint.findByPk(req.params.id);
            if (!hint) {
                return res.status(404).json({
                    success: false,
                    error: 'Hint not found'
                });
            }
            res.status(200).json({
                success: true,
                data: hint
            });
        } catch (error) {
            console.error('Error fetching hint:', error);
            res.status(500).json({
                success: false,
                error: 'Error fetching hint'
            });
        }
    },

    // Update hint
    updateHint: async (req, res) => {
        try {
            const hint = await Hint.findByPk(req.params.id);
            if (!hint) {
                return res.status(404).json({
                    success: false,
                    error: 'Hint not found'
                });
            }
            
            await hint.update(req.body);
            res.status(200).json({
                success: true,
                data: hint
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    // Delete hint
    deleteHint: async (req, res) => {
        try {
            const hint = await Hint.findByPk(req.params.id);
            if (!hint) {
                return res.status(404).json({
                    success: false,
                    error: 'Hint not found'
                });
            }
            
            await hint.destroy();
            res.status(200).json({
                success: true,
                message: 'Hint deleted successfully'
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    // Get most viewed hints
    getMostViewedHints: async (req, res) => {
        try {
            const hints = await Hint.findAll({
                order: [['views', 'DESC']],
                limit: 10
            });
            res.status(200).json({
                success: true,
                data: hints
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    },

    // Bulk insert hints from static data
    bulkInsertHints: async (req, res) => {
        try {
            const hintsData = req.body; // Array of hint objects

            // Validate input
            if (!Array.isArray(hintsData) || hintsData.length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Invalid data format. Expected an array of hints.'
                });
            }

            // Insert all hints
            const createdHints = await Hint.bulkCreate(hintsData);

            res.status(201).json({
                success: true,
                message: `${createdHints.length} hints inserted successfully`,
                data: createdHints
            });
        } catch (error) {
            console.error('Error inserting hints:', error);
            res.status(500).json({
                success: false,
                error: 'Error inserting hints'
            });
        }
    },

    // Increment view count for a hint
    incrementViewCount: async (req, res) => {
        try {
            const hint = await Hint.findByPk(req.params.id);
            if (!hint) {
                return res.status(404).json({
                    success: false,
                    error: 'Hint not found'
                });
            }
            
            // Increment the views count
            hint.views = (hint.views || 0) + 1;
            await hint.save();
            
            // Return the updated hint
            res.status(200).json({
                success: true,
                message: 'View count incremented successfully',
                data: hint
            });
        } catch (error) {
            console.error('Error incrementing view count:', error);
            res.status(500).json({
                success: false,
                error: 'Error incrementing view count'
            });
        }
    }
};

module.exports = hintController; 