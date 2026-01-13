const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const auth = require('../middleware/auth');

// Submit contact form
router.post('/', contactController.submitContactForm);

// Admin routes
router.get('/', auth, contactController.getAllContacts);
router.put('/:id/read', auth, contactController.markAsRead);
router.delete('/:id', auth, contactController.deleteContact);

module.exports = router;
