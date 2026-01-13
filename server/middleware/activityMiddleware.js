const User = require('../models/User');

const activityMiddleware = async (req, res, next) => {
    // Only track if user is authenticated and we have a user ID
    if (req.user && req.user.id) {
        try {
            // Use updateOne for performance (no document load needed)
            // Fire and forget - don't await to avoid slowing down the response
            User.updateOne({ _id: req.user.id }, { lastActiveAt: new Date() }).exec();
        } catch (err) {
            console.error("Error updating last active:", err);
        }
    }
    next();
};

module.exports = activityMiddleware;
