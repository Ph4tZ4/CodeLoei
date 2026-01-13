const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    displayName: {
        type: String,
        default: 'Admin'
    },
    photoURL: {
        type: String,
        default: '' // Can be a system icon
    },
    role: {
        type: String,
        default: 'admin' // Future proofing
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Admin', AdminSchema);
