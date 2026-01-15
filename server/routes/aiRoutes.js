const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const auth = require('../middleware/auth'); // Assuming you have auth middleware

// @route   POST /api/ai/analyze
// @desc    Analyze projects
// @access  Private (Admin only ideally, but 'Private' for now)
router.post('/analyze', auth, aiController.analyzeProjects);

// @route   POST /api/ai/analyze-overview
// @desc    Analyze project overview stats
// @access  Private
router.post('/analyze-overview', auth, aiController.analyzeOverview);

module.exports = router;
