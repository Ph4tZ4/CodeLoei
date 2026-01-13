const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historyController');
const auth = require('../middleware/auth');

// @route   POST api/history
// @desc    Record a project view
// @access  Private
router.post('/', auth, historyController.recordView);

// @route   GET api/history
// @desc    Get user's browsing history
// @access  Private
router.get('/', auth, historyController.getHistory);

module.exports = router;
