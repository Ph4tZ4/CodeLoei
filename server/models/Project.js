const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: String,
    language: String,
    stars: {
        type: Number,
        default: 0
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    visibility: {
        type: String,
        enum: ['public', 'private'],
        default: 'public'
    },
    videoUrl: String,
    downloadCount: {
        type: Number,
        default: 0
    },
    views: {
        type: Number,
        default: 0
    },
    starredBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    license: String,
    tags: [String],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Project', ProjectSchema);
