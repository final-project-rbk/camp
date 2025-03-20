const adminMiddleware = (req, res, next) => {
  // The user object should be attached by the auth middleware
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Check if the user has admin role
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};

module.exports = adminMiddleware; 