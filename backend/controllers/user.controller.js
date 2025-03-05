const { User } = require('../models');

const userController = {
  // Get single user
  getUser: async (req, res) => {
    try {
      const { id } = req.params;
      
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
        profile_image
      } = req.body;

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
        profile_image: profile_image || user.profile_image
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
  }
};

module.exports = userController; 