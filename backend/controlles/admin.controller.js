const { User, FormularAdvisor, AdvisorMedia, Advisor, Review } = require('../models');
const db = require('../models');

const   adminController = {
    // Get all users with their status
    getAllUsers: async (req, res) => {
        try {
            // Add debug logging
            console.log('Request headers:', req.headers);
            console.log('Request user:', req.user);

            // Check if user exists
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: 'Authentication required'
                });
            }

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
                error: 'Error fetching users',
                details: error.message
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

            // Toggle the ban status
            const newBanStatus = !user.isBanned;
            await user.update({ isBanned: newBanStatus });

            res.status(200).json({
                success: true,
                message: newBanStatus ? 'User banned successfully' : 'User unbanned successfully'
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
                order: [['createdAt', 'DESC']]
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

    // Add this new method to get advisor details with ratings
    getAdvisorDetails: async (req, res) => {
        try {
            // Check if the requesting user is an admin or an advisor
            if (req.user.role !== 'admin' && req.user.role !== 'advisor') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Admin or advisor privileges required.'
                });
            }

            const { advisorId } = req.params;
            
            // Find advisor with reviews
            const advisor = await Advisor.findOne({
                where: { 
                    [req.user.role === 'advisor' ? 'userId' : 'id']: advisorId 
                },
                include: [
                    {
                        model: User,
                        attributes: ['id', 'first_name', 'last_name', 'email', 'bio', 'profile_image', 'points']
                    },
                    {
                        model: Review,
                        attributes: ['rating', 'comment', 'created_at'],
                        include: [{
                            model: User,
                            attributes: ['first_name', 'last_name']
                        }]
                    }
                ]
            });

            if (!advisor) {
                return res.status(404).json({
                    success: false,
                    message: 'Advisor not found'
                });
            }

            // Calculate average rating
            let averageRating = 0;
            if (advisor.Reviews && advisor.Reviews.length > 0) {
                const totalRating = advisor.Reviews.reduce((sum, review) => sum + review.rating, 0);
                averageRating = totalRating / advisor.Reviews.length;
            }

            res.status(200).json({
                success: true,
                data: {
                    ...advisor.toJSON(),
                    averageRating,
                    reviewCount: advisor.Reviews?.length || 0
                }
            });
        } catch (error) {
            console.error('Error fetching advisor details:', error);
            res.status(500).json({
                success: false,
                error: 'Error fetching advisor details'
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

            // Use sequelize directly from the connection export
            const transaction = await db.connection.transaction();

            try {
                await formular.update({ status }, { transaction });

                if (status === 'approved') {
                    // Create advisor record
                    await Advisor.create({
                        userId: formular.userId,
                        isVerified: true,
                        cin: formular.cin
                    }, { transaction });

                    // Update user role
                    await User.update(
                        { role: 'advisor' },
                        { 
                            where: { id: formular.userId },
                            transaction
                        }
                    );
                }

                await transaction.commit();

                res.status(200).json({
                    success: true,
                    message: `Application ${status} successfully`
                });
            } catch (error) {
                await transaction.rollback();
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

    // Add this method to your adminController
    updateUserRole: async (req, res) => {
        try {
            // Check if user is admin
            if (req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Admin privileges required.'
                });
            }

            const { userId } = req.params;
            const { role } = req.body;

            // Validate role
            if (!['user', 'advisor', 'admin'].includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid role. Must be "user", "advisor", or "admin"'
                });
            }

            const user = await User.findByPk(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Prevent admin from changing their own role
            if (user.id === req.user.id) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot change your own role'
                });
            }

            // Start transaction to ensure database consistency
            const transaction = await db.connection.transaction();

            try {
                // If changing to advisor, check if advisor record already exists
                if (role === 'advisor' && user.role !== 'advisor') {
                    // Check if the advisor record already exists
                    const existingAdvisor = await Advisor.findOne({
                        where: { userId: user.id }
                    });

                    if (!existingAdvisor) {
                        // Create a new advisor record
                        await Advisor.create({
                            userId: user.id,
                            isVerified: true,
                            cin: 'Admin assigned' // Default value
                        }, { transaction });
                    }
                }

                // Update the user role
                await user.update({ role }, { transaction });
                
                await transaction.commit();

                res.status(200).json({
                    success: true,
                    message: `User role updated to ${role} successfully`
                });
            } catch (error) {
                await transaction.rollback();
                throw error;
            }
        } catch (error) {
            console.error('Error updating user role:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating user role',
                error: error.message
            });
        }
    },

    // Remove advisor role and delete advisor record
    removeAdvisorRole: async (req, res) => {
        try {
            // Check if user is admin
            if (req.user.role !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Admin privileges required.'
                });
            }

            const { userId } = req.params;

            const user = await User.findByPk(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            if (user.role !== 'advisor') {
                return res.status(400).json({
                    success: false,
                    message: 'User is not an advisor'
                });
            }

            // Start a transaction
            const transaction = await db.connection.transaction();

            try {
                // Find the advisor record
                const advisor = await Advisor.findOne({
                    where: { userId: user.id }
                });

                if (advisor) {
                    // Delete the advisor record
                    await advisor.destroy({ transaction });
                }

                // Update user role to user
                await user.update({ role: 'user' }, { transaction });

                await transaction.commit();

                res.status(200).json({
                    success: true,
                    message: 'User role updated to user and removed from advisors'
                });
            } catch (error) {
                await transaction.rollback();
                throw error;
            }
        } catch (error) {
            console.error('Error removing advisor role:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating user role',
                error: error.message
            });
        }
    }
};

module.exports = adminController; 