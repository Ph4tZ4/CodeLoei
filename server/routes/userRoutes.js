const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const userController = require('../controllers/userController');
const authOptional = require('../middleware/authOptional');

// @route   GET api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', auth, userController.getProfile);

// @route   PUT api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, userController.updateProfile);

// @route   PUT api/users/pin
// @desc    Toggle pin project
// @access  Private
router.put('/pin', auth, userController.togglePinProject);

// @route   PUT api/users/:id/ban
// @desc    Ban/Unban user
// @access  Admin
router.put('/:id/ban', auth, userController.banUser);

// @route   PUT api/users/:id
// @desc    Update user by admin
// @access  Admin
router.put('/:id', auth, userController.updateUserByAdmin);

// @route   GET api/users/:id
// @desc    Get public user profile
// @access  Public (Optional Auth for follow status)
router.get('/:id', authOptional, userController.getPublicProfile);

// @route   PUT api/users/:id/follow
// @desc    Toggle follow user
// @access  Private
router.put('/:id/follow', auth, userController.toggleFollow);

// @route   GET api/users
// @desc    Get all users
// @access  Admin
router.get('/', auth, userController.getAllUsers);

// @route   DELETE api/users/:id
// @desc    Delete user
// @access  Admin
router.delete('/:id', auth, userController.deleteUser);

module.exports = router;
