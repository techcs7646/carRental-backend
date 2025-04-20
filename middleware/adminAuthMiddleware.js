const { verifyToken } = require('../utils/jwt');
const Admin = require('../models/adminModel');

exports.protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({ message: 'Authorization header missing' });
        }

        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Token must be Bearer token' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token not provided' });
        }

        // Verify token
        const decoded = verifyToken(token);
        if (!decoded) {
            return res.status(401).json({ message: 'Invalid or expired token' });
        }

        // Check if admin exists
        const admin = await Admin.findById(decoded.id);
        if (!admin) {
            return res.status(401).json({ message: 'Admin not found' });
        }

        req.admin = admin;
        next();
    } catch (error) {
        res.status(401).json({ 
            message: 'Authentication failed',
            error: error.message 
        });
    }
};