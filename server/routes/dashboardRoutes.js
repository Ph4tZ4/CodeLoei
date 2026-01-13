const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/auth');

// @route   GET api/dashboard/stats
// @desc    Get dashboard statistics for the logged-in user
// @access  Private
router.get('/stats', auth, dashboardController.getDashboardStats);

// @route   GET api/dashboard/admin-stats
// @desc    Get global statistics for admin
// @access  Private (Admin only ideally)
router.get('/admin-stats', auth, dashboardController.getAdminStats);

module.exports = router;
