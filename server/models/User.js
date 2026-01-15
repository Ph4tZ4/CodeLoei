const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    studentId: {
        type: String
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    username: {
        type: String,
        unique: true
    },
    password: {
        type: String
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true
    },
    userType: {
        type: String,
        enum: ['general', 'college_member'],
        default: 'general'
    },
    displayName: {
        type: String,
        default: 'Student'
    },
    photoURL: {
        type: String,
        default: ''
    },
    skills: [String],
    bio: String,
    location: String,
    website: String,
    publicEmail: String,
    pinnedProjects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    }],
    followers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    following: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    createdAt: {
        type: Date,
        default: Date.now,
        index: true // Index for "New Users" stats
    },
    lastActiveAt: {
        type: Date,
        default: Date.now,
        index: true // Index for "Online Users" stats
    },
    isBanned: {
        type: Boolean,
        default: false,
        index: true // Index for filtering banned users
    },
    bannedUntil: {
        type: Date
    },
    banReason: {
        type: String
    },
    otp: {
        type: String
    },
    otpExpires: {
        type: Date
    },
    isVerified: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model('User', UserSchema);
