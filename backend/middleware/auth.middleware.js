const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from header or query params (for socket.io)
    const token = req.header('Authorization')?.replace('Bearer ', '') || 
                 req.query.token;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user and exclude sensitive data
    const user = await User.findByPk(decoded.id, {
      attributes: { 
        exclude: ['password', 'tokenVerification'],
        include: ['id', 'email', 'role', 'first_name', 'last_name'] 
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    if (user.isBanned) {
      return res.status(403).json({
        success: false,
        error: 'Account is banned'
      });
    }

    // Add user and token to request object
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      error: 'Please authenticate'
    });
  }
};

module.exports = authMiddleware; 