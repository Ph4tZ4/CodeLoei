const express = require('express');
const router = express.Router();
const ActivityLog = require('../models/ActivityLog');
const auth = require('../middleware/auth');

// @route   GET /api/activity
// @desc    Get recent activity logs
// @access  Private (Admin)
router.get('/', auth, async (req, res) => {
    try {
        const logs = await ActivityLog.find()
            .sort({ createdAt: -1 })
            .limit(50)
            .populate('user', 'displayName email photoURL');
        res.json(logs);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
