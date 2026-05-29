  import jwt from 'jsonwebtoken';

  /**
   * Middleware to protect routes - verify JWT token
   */
  export const authenticate = (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(401).json({ message: 'No authentication token provided' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token has expired' });
      }
      res.status(401).json({ message: 'Invalid token' });
    }
  };

  /**
   * Middleware for role-based authorization
   */
  export const authorize = (...allowedRoles) => {
    return async (req, res, next) => {
      try {
        const User = (await import('../models/User.js')).default;
        const user = await User.findById(req.user.userId);

        if (!user || !allowedRoles.includes(user.role)) {
          return res.status(403).json({ message: 'Access denied' });
        }

        next();
      } catch (error) {
        res.status(500).json({ message: 'Authorization failed' });
      }
    };
  };
