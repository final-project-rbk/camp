const { User, FormularAdvisor, AdvisorMedia, Advisor, Place, Categorie, connection } = require('../models');

const adminController = {
    // Get all users with their status
    getAllUsers: async (req, res) => {
        try {
            // Check if the requesting user is an admin
            if (req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Admin privileges required.'
                });
            }

            const users = await User.findAll({
                attributes: ['id', 'first_name', 'last_name', 'email', 'role', 'isBanned', 'created_at', 'profile_image'],
                order: [['created_at', 'DESC']]
            });

            res.status(200).json({
                success: true,
                data: users
            });
        } catch (error) {
            console.error('Error fetching users:', error);
            res.status(500).json({
                success: false,
                error: 'Error fetching users'
            });
        }
    },

    // Ban/Unban user
    toggleUserBan: async (req, res) => {
        try {
            // Check if the requesting user is an admin
            if (req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Admin privileges required.'
                });
            }

            const { userId } = req.params;
            const { isBanned } = req.body;

            const user = await User.findByPk(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Prevent admin from banning themselves
            if (user.id === req.user.id) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot ban yourself'
                });
            }

            await user.update({ isBanned });

            res.status(200).json({
                success: true,
                message: isBanned ? 'User banned successfully' : 'User unbanned successfully'
            });
        } catch (error) {
            console.error('Error toggling user ban:', error);
            res.status(500).json({
                success: false,
                error: 'Error updating user status'
            });
        }
    },

    // Get all advisor applications
    getAdvisorApplications: async (req, res) => {
        try {
            // Check if the requesting user is an admin
            if (req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Admin privileges required.'
                });
            }

            const applications = await FormularAdvisor.findAll({
                include: [
                    {
                        model: User,
                        attributes: ['first_name', 'last_name', 'email', 'profile_image']
                    },
                    {
                        model: AdvisorMedia
                    }
                ],
                order: [['created_at', 'DESC']]
            });

            res.status(200).json({
                success: true,
                data: applications
            });
        } catch (error) {
            console.error('Error fetching advisor applications:', error);
            res.status(500).json({
                success: false,
                error: 'Error fetching applications'
            });
        }
    },

    // Handle advisor application (approve/reject)
    handleAdvisorApplication: async (req, res) => {
        try {
            // Check if the requesting user is an admin
            if (req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Admin privileges required.'
                });
            }

            const { formularId } = req.params;
            const { status } = req.body;

            if (!['approved', 'rejected'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid status. Must be either "approved" or "rejected"'
                });
            }

            const formular = await FormularAdvisor.findByPk(formularId, {
                include: [{ model: User }]
            });

            if (!formular) {
                return res.status(404).json({
                    success: false,
                    message: 'Application not found'
                });
            }

            // Start a transaction
            const t = await connection.transaction();

            try {
                await formular.update({ status }, { transaction: t });

                if (status === 'approved') {
                    // Create advisor record
                    await Advisor.create({
                        userId: formular.userId,
                        isVerified: true,
                        cin: formular.cin
                    }, { transaction: t });

                    // Update user role
                    await User.update(
                        { role: 'advisor' },
                        { 
                            where: { id: formular.userId },
                            transaction: t 
                        }
                    );
                }

                await t.commit();

                res.status(200).json({
                    success: true,
                    message: `Application ${status} successfully`
                });
            } catch (error) {
                await t.rollback();
                throw error;
            }
        } catch (error) {
            console.error('Error handling advisor application:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating application',
                error: error.message
            });
        }
    },

    createPlace: async (req, res) => {
        let transaction;
        try {
            transaction = await connection.transaction();
            
            const { name, location, description, images, Categories } = req.body;
            const creatorId = req.user.id;

            // Create the place
            const place = await Place.create({
                name,
                location,
                description,
                images: images || [],
                creatorId,
                status: 'approved' // Places created by admin are automatically approved
            }, { transaction });

            // Add categories if provided
            if (Categories && Array.isArray(Categories)) {
                const categoryPromises = Categories.map(async (cat) => {
                    const [category] = await Categorie.findOrCreate({
                        where: { name: cat.name },
                        defaults: { icon: cat.icon || '🏷️' },
                        transaction
                    });
                    return category;
                });

                const categories = await Promise.all(categoryPromises);
                await place.setCategories(categories, { transaction });
            }

            // Commit the transaction
            await transaction.commit();

            // Fetch the created place with categories
            const createdPlace = await Place.findByPk(place.id, {
                include: [{ model: Categorie, as: 'Categories' }]
            });

            return res.status(201).json({
                success: true,
                data: createdPlace
            });
        } catch (error) {
            // Rollback the transaction on error
            if (transaction) await transaction.rollback();
            console.error("Error creating place:", error);
            return res.status(500).json({ 
                success: false,
                error: "Internal server error" 
            });
        }
    }
};

module.exports = adminController; 