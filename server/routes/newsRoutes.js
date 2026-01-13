const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');

// @route   GET api/news
// @desc    Get all news
// @access  Public
router.get('/', newsController.getNews);

// @route   GET api/news/:id
// @desc    Get news by ID
// @access  Public
router.get('/:id', newsController.getNewsById);

// @route   POST api/news/seed
// @desc    Seed news data
// @access  Public (dev)
router.post('/seed', newsController.seedNews);

const auth = require('../middleware/auth');

// @route   POST api/news
// @desc    Create news
// @access  Admin
router.post('/', auth, newsController.createNews);

// @route   PUT api/news/:id
// @desc    Update news
// @access  Admin
router.put('/:id', auth, newsController.updateNews);

// @route   DELETE api/news/:id
// @desc    Delete news
// @access  Admin
router.delete('/:id', auth, newsController.deleteNews);

module.exports = router;
