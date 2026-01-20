const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function (req, res, next) {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if not token
    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

        let user;
        // Check if admin based on role in payload
        if (decoded.user.role === 'admin') {
            const Admin = require('../models/Admin');
            user = await Admin.findById(decoded.user.id).select('-password');
            if (user) {
                user = user.toObject();
                user.role = 'admin';
                user.userType = 'admin';
            }
        } else {
            user = await User.findById(decoded.user.id).select('-password');
        }

        req.user = user || null;

        next();
    } catch (err) {
        req.user = null;
        next();
    }
};
