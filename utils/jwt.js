const jwt = require('jsonwebtoken');

exports.createToken = (user) => {
    return jwt.sign(
        { 
            id: user._id,
            role: user.role
        }, 
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );
};

exports.verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        return null;
    }
};

exports.getTokenFromHeader = (req) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.split(' ')[1];
    }
    return null;
};

exports.isValidToken = (token) => {
    if (!token) return false;
    
    const decoded = this.verifyToken(token);
    return !!decoded;
};