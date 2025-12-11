const jwt = require('jsonwebtoken');
const keys = require('../config/keys');

/**
 * Authentication middleware to verify JWT tokens
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const isAuth = (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'No authorization token provided'
            });
        }
        
        // Extract token (handle "Bearer <token>" format)
        let token = authHeader;
        if (authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
        
        // Verify token
        const decoded = jwt.verify(token, keys.secret);
        
        // Attach user info to request
        req.user = decoded;
        
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Authentication failed',
                message: 'Invalid token'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Authentication failed',
                message: 'Token expired'
            });
        }
        
        return res.status(500).json({
            error: 'Server error',
            message: 'Authentication verification failed'
        });
    }
};

module.exports = isAuth;