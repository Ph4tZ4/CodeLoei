const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function (req, res, next) {
    // Get token from header
    const token = req.header('x-auth-token');

    // Check if not token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

        let user;
        // Check if admin based on role in payload
        if (decoded.user.role === 'admin') {
            const Admin = require('../models/Admin');
            user = await Admin.findById(decoded.user.id).select('-password');
            if (user) {
                // Ensure role is explicitly set on the object for frontend usage
                user = user.toObject();
                user.role = 'admin';
                user.userType = 'admin';
            }
        } else {
            user = await User.findById(decoded.user.id).select('-password');
        }

        if (!user) {
            return res.status(401).json({ msg: 'Token is not valid (User not found)' });
        }

        req.user = user;

        // Track Activity for Regular Users
        if (decoded.user.role !== 'admin' && user._id) {
            // Fire and forget update
            User.updateOne({ _id: user._id }, { lastActiveAt: new Date() }).exec().catch(e => console.error("Activity Update Error:", e));
        }

        next();
    } catch (err) {
        console.error('Auth Middleware Error:', err.message);
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
