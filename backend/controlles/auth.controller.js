const { User } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validatePassword } = require('../utils/passwordValidation');

// Add this check at the top of the file
if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  throw new Error('JWT secrets not found in environment variables');
}

const generateTokens = (user) => {
  try {
    const accessToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  } catch (error) {
    console.error('Error generating tokens:', error);
    throw new Error('Error generating authentication tokens');
  }
};

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

      // Basic input validation
      if (!email || !password || !first_name || !last_name) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields'
        });
      }

      // Advanced password validation
      const passwordCheck = validatePassword(password);
      if (!passwordCheck.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid password',
          details: passwordCheck.errors
        });
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format'
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

      // Hash password with increased security
      const salt = await bcrypt.genSalt(12); // Increased from 10 to 12
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create new user
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

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user);

      // Remove sensitive data from response
      const userResponse = user.toJSON();
      delete userResponse.password;
      delete userResponse.refreshToken;

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: userResponse,
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      console.error('Error in signup:', error);
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

      // Check if user is banned
      if (user.isBanned) {
        return res.status(403).json({
          success: false,
          error: 'Account is banned'
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

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user);

      // Store refresh token hash in DB
      const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
      await user.update({ refreshToken: refreshTokenHash });

      // Remove sensitive data from response
      const userResponse = user.toJSON();
      delete userResponse.password;
      delete userResponse.refreshToken;

      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: userResponse,
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      console.error('Error in login:', error);
      res.status(500).json({
        success: false,
        error: 'Error during login'
      });
    }
  },

  refreshToken: async (req, res) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          error: 'Refresh token required'
        });
      }

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
      const user = await User.findByPk(decoded.id);

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid refresh token'
        });
      }

      // Verify stored refresh token
      const isValidRefreshToken = await bcrypt.compare(refreshToken, user.refreshToken);
      if (!isValidRefreshToken) {
        return res.status(401).json({
          success: false,
          error: 'Invalid refresh token'
        });
      }

      // Generate new tokens
      const tokens = generateTokens(user);

      // Update refresh token in DB
      const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
      await user.update({ refreshToken: refreshTokenHash });

      res.status(200).json({
        success: true,
        data: tokens
      });
    } catch (error) {
      console.error('Error in refreshToken:', error);
      res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }
  },

  logout: async (req, res) => {
    try {
      // Clear refresh token in DB
      await req.user.update({ refreshToken: null });

      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      console.error('Error in logout:', error);
      res.status(500).json({
        success: false,
        error: 'Error during logout'
      });
    }
  }
};

module.exports = authController; 