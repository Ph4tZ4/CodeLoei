const express = require('express');
const router = express.Router();
const { register, login, getMe, googleLogin } = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.get('/me', auth, getMe);

const adminController = require('../controllers/adminController');

// ... existing routes
router.post('/admin/login', adminController.login);
router.post('/admin/create', adminController.createAdmin); // Protect this or remove after seeding? Keep for now.

module.exports = router;
