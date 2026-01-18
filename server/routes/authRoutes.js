const express = require('express');
const router = express.Router();
const { register, login, getMe, googleLogin, verifyOTP, changePassword, forgotPassword, resetPassword, verifyPasswordOTP } = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/register', register);
router.post('/verify', verifyOTP);
router.post('/login', login);
router.post('/google', googleLogin);
router.get('/me', auth, getMe);
router.post('/change-password', auth, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/verify-password-otp', verifyPasswordOTP);

const adminController = require('../controllers/adminController');

// ... existing routes
router.post('/admin/login', adminController.login);
router.post('/admin/create', adminController.createAdmin); // Protect this or remove after seeding? Keep for now.

module.exports = router;
