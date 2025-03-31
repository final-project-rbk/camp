const { User } = require('../models');

const userController = {
  // Get single user
  getUser: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Check if the requesting user has permission to access this profile
      // req.user is set by the auth middleware
      if (!req.user || (req.user.id !== parseInt(id) && !req.user.isAdmin)) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized access to this profile'
        });
      }

      const user = await User.findByPk(id, {
        attributes: { 
          exclude: ['password', 'tokenVerification'] 
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Error in getUser:', error);
      res.status(500).json({
        success: false,
        error: 'Error fetching user'
      });
    }
  },

  // Update user
  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        first_name,
        last_name,
        email,
        phone_number,
        profile_image,
        bio
      } = req.body;

      // Check if the requesting user has permission to update this profile
      if (!req.user || (req.user.id !== parseInt(id) && !req.user.isAdmin)) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized to update this profile'
        });
      }

      const user = await User.findByPk(id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      await user.update({
        first_name: first_name || user.first_name,
        last_name: last_name || user.last_name,
        email: email || user.email,
        phone_number: phone_number || user.phone_number,
        profile_image: profile_image || user.profile_image,
        bio: bio || user.bio
      });

      // Exclude sensitive data from response
      const updatedUser = await User.findByPk(id, {
        attributes: { exclude: ['password', 'tokenVerification'] }
      });

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: updatedUser
      });
    } catch (error) {
      console.error('Error in updateUser:', error);
      res.status(500).json({
        success: false,
        error: 'Error updating user'
      });
    }
  },

  // Get user profile (own profile)
  getProfile: async (req, res) => {
    try {
      // req.user should be set by auth middleware
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const userId = req.user.id;
      
      const user = await User.findByPk(userId, {
        attributes: { 
          exclude: ['password', 'tokenVerification'] 
        }
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Error in getProfile:', error);
      res.status(500).json({
        success: false,
        error: 'Error fetching profile'
      });
    }
  },

  // Get all users (admin only)
  getAllUsers: async (req, res) => {
    try {
      // Check if the requesting user is an admin
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Admin privileges required.'
        });
      }

      const users = await User.findAll({
        attributes: [
          'id', 
          'first_name', 
          'last_name', 
          'email', 
          'role', 
          'isBanned',
          'created_at',
          'profile_image'
        ]
      });

      res.status(200).json({
        success: true,
        data: users
      });
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      res.status(500).json({
        success: false,
        error: 'Error fetching users'
      });
    }
  },

  // Ban/Unban user (admin only)
  toggleUserBan: async (req, res) => {
    try {
      // Check if the requesting user is an admin
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Admin privileges required.'
        });
      }

      const { id } = req.params;
      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Toggle ban status
      await user.update({ isBanned: !user.isBanned });

      res.status(200).json({
        success: true,
        message: user.isBanned ? 'User banned successfully' : 'User unbanned successfully',
        data: {
          id: user.id,
          isBanned: user.isBanned
        }
      });
    } catch (error) {
      console.error('Error in toggleUserBan:', error);
      res.status(500).json({
        success: false,
        error: 'Error updating user ban status'
      });
    }
  },

  // Update user role (admin only)
  updateUserRole: async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      // Validate role
      const validRoles = ['user', 'advisor', 'admin'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid role specified'
        });
      }

      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      await user.update({ role });

      res.status(200).json({
        success: true,
        message: 'User role updated successfully',
        data: {
          id: user.id,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Error in updateUserRole:', error);
      res.status(500).json({
        success: false,
        error: 'Error updating user role'
      });
    }
  },
};

module.exports = userController; 