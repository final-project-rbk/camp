const { FormularAdvisor, AdvisorMedia, User } = require('../models');

const formularAdvisorController = {
    // Create new advisor application with media
    create: async (req, res) => {
        try {
            console.log('Received request body:', req.body); // Debug log

            const {
                userId,
                address,
                phoneNumber,
                cin,
                motivation,
                eventTypes,
                experience,
                socialMediaLinks,
                termsAccepted,
                genuineInfoAgreed,
                cinFront,
                cinBack,
                certificate,
                faceImage
            } = req.body;

            // Validate required fields
            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: 'User ID is required'
                });
            }

            // Create formular first
            const formular = await FormularAdvisor.create({
                userId: Number(userId), // Ensure userId is a number
                address,
                phoneNumber,
                cin,
                motivation,
                eventTypes,
                experience,
                socialMediaLinks: socialMediaLinks || '',
                termsAccepted,
                genuineInfoAgreed,
                status: 'pending'
            });

            console.log('Created formular:', formular); // Debug log

            // Create associated media if provided
            if (cinFront || cinBack || certificate || faceImage) {
                await AdvisorMedia.create({
                    cinFront: cinFront || '',
                    cinBack: cinBack || '',
                    certificate: certificate || '',
                    faceImage: faceImage || '',
                    formularId: formular.id
                });
            }

            // Fetch the complete formular with media
            const completeFormular = await FormularAdvisor.findByPk(formular.id, {
                include: [
                    { 
                        model: User, 
                        attributes: ['first_name', 'last_name', 'email'] 
                    },
                    { 
                        model: AdvisorMedia 
                    }
                ]
            });

            res.status(201).json({
                success: true,
                message: 'Advisor application submitted successfully',
                data: completeFormular
            });
        } catch (error) {
            console.error('Create advisor error:', error); // Debug log
            res.status(500).json({
                success: false,
                message: 'Error submitting advisor application',
                error: error.message
            });
        }
    },

    // Get all applications with media
    getAll: async (req, res) => {
        try {
            const formulars = await FormularAdvisor.findAll({
                include: [
                    { 
                        model: User, 
                        attributes: ['first_name', 'last_name', 'email'] 
                    },
                    { 
                        model: AdvisorMedia 
                    }
                ]
            });

            res.status(200).json({
                success: true,
                data: formulars
            });
        } catch (error) {
            console.error('Get all advisors error:', error); // Debug log
            res.status(500).json({
                success: false,
                message: 'Error fetching applications',
                error: error.message
            });
        }
    },

    getByUserId: async (req, res) => {
        try {
            const { userId } = req.params;

            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: 'User ID is required'
                });
            }

            const formular = await FormularAdvisor.findOne({
                where: { userId: Number(userId) },
                include: [
                    { 
                        model: User, 
                        attributes: ['first_name', 'last_name', 'email'] 
                    },
                    { 
                        model: AdvisorMedia 
                    }
                ],
                order: [[AdvisorMedia, 'createdAt', 'DESC']]
            });

            if (!formular) {
                return res.status(404).json({
                    success: false,
                    message: 'No formular found for this user'
                });
            }

            res.status(200).json({
                success: true,
                data: formular
            });
        } catch (error) {
            console.error('Get by user ID error:', error); // Debug log
            res.status(500).json({
                success: false,
                message: 'Error fetching user applications',
                error: error.message
            });
        }
    },

    // Add update method
    update: async (req, res) => {
        try {
            const { id } = req.params;
            console.log('Update request for id:', id); // Debug log
            console.log('Update request body:', req.body); // Debug log

            const {
                userId,
                address,
                phoneNumber,
                cin,
                motivation,
                eventTypes,
                experience,
                socialMediaLinks,
                termsAccepted,
                genuineInfoAgreed,
                cinFront,
                cinBack,
                certificate,
                faceImage
            } = req.body;

            // Find existing formular
            const existingFormular = await FormularAdvisor.findByPk(Number(id), {
                include: [{ model: AdvisorMedia }]
            });

            if (!existingFormular) {
                return res.status(404).json({
                    success: false,
                    message: 'No formular found with this ID'
                });
            }

            // Update formular
            await existingFormular.update({
                address,
                phoneNumber,
                cin,
                motivation,
                eventTypes,
                experience,
                socialMediaLinks: socialMediaLinks || '',
                termsAccepted,
                genuineInfoAgreed,
                status: 'pending'
            });

            // Update or create media
            if (existingFormular.AdvisorMedia) {
                await existingFormular.AdvisorMedia.update({
                    cinFront: cinFront || existingFormular.AdvisorMedia.cinFront,
                    cinBack: cinBack || existingFormular.AdvisorMedia.cinBack,
                    certificate: certificate || existingFormular.AdvisorMedia.certificate,
                    faceImage: faceImage || existingFormular.AdvisorMedia.faceImage
                });
            } else if (cinFront || cinBack || certificate || faceImage) {
                await AdvisorMedia.create({
                    cinFront: cinFront || '',
                    cinBack: cinBack || '',
                    certificate: certificate || '',
                    faceImage: faceImage || '',
                    formularId: existingFormular.id
                });
            }

            // Fetch updated formular
            const updatedFormular = await FormularAdvisor.findByPk(existingFormular.id, {
                include: [
                    { 
                        model: User, 
                        attributes: ['first_name', 'last_name', 'email'] 
                    },
                    { 
                        model: AdvisorMedia 
                    }
                ]
            });

            res.status(200).json({
                success: true,
                message: 'Advisor application updated successfully',
                data: updatedFormular
            });
        } catch (error) {
            console.error('Update advisor error:', error); // Debug log
            res.status(500).json({
                success: false,
                message: 'Error updating advisor application',
                error: error.message
            });
        }
    },

    updateStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            // Validate status
            if (!['approved', 'rejected'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid status'
                });
            }

            const formular = await FormularAdvisor.findByPk(id, {
                include: [{ model: User }]
            });

            if (!formular) {
                return res.status(404).json({
                    success: false,
                    message: 'Formular not found'
                });
            }

            // Update formular status
            await formular.update({ status });

            // If approved, update user role to advisor
            if (status === 'approved') {
                await User.update(
                    { role: 'advisor' },
                    { where: { id: formular.userId } }
                );
            }

            res.status(200).json({
                success: true,
                message: `Application ${status}`,
                data: formular
            });
        } catch (error) {
            console.error('Update status error:', error);
            res.status(500).json({
                success: false,
                message: 'Error updating application status',
                error: error.message
            });
        }
    }
};

module.exports = formularAdvisorController; 