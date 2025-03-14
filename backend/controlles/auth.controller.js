const { User } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const authController = {
  // User signup
  signup: async (req, res) => {
    try {
      const {
        first_name,
        last_name,
        email,
        password,
        phone_number,
        profile_image
      } = req.body;

      // Add input validation
      if (!email || !password || !first_name || !last_name) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Email already registered'
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create new user with more detailed error handling
      try {
        const user = await User.create({
          first_name,
          last_name,
          email,
          password: hashedPassword,
          phone_number,
          profile_image,
          role: 'user',
          created_at: new Date(),
          updated_at: new Date()
        });

        // Generate JWT token
        const token = jwt.sign(
          { id: user.id, email: user.email },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );

        // Remove password from response
        const userResponse = user.toJSON();
        delete userResponse.password;
        delete userResponse.tokenVerification;

        res.status(201).json({
          success: true,
          message: 'User registered successfully',
          data: {
            user: userResponse,
            token
          }
        });

      } catch (dbError) {
        console.error('Database error during user creation:', dbError);
        return res.status(400).json({
          success: false,
          error: dbError.message || 'Error creating user'
        });
      }
    } catch (error) {
      console.error('Error in signup:', error.message, '\n', error.stack);
      res.status(500).json({
        success: false,
        error: error.message || 'Error creating user'
      });
    }
  },

  // User login
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Remove sensitive data from response
      const userResponse = user.toJSON();
      delete userResponse.password;
      delete userResponse.tokenVerification;

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: userResponse,
          token
        }
      });
    } catch (error) {
      console.error('Error in login:', error);
      res.status(500).json({
        success: false,
        error: 'Error during login'
      });
    }
  }
};

module.exports = authController; 