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

        // Fetch user (optional, but consistent with main auth)
        // We only really need the ID for the query, but fetching user is safer for role checks if needed
        // For performance, maybe just use decoded.user? 
        // The main auth middleware fetches full user. Let's do that for consistency if easy.

        req.user = await User.findById(decoded.user.id).select('-password');
        // If user deleted, treat as guest
        if (!req.user) req.user = null;

        next();
    } catch (err) {
        // INVALID token - usually implies tampering or expiry. 
        // Should we block or treat as guest? 
        // Treating as guest (req.user = null) is safer for "optional" routes so the page doesn't crash.
        req.user = null;
        next();
    }
};
