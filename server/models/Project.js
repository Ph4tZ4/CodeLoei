const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        index: true // Index name for searching
    },
    description: String,
    language: String,
    stars: {
        type: Number,
        default: 0,
        index: true // Index for sorting by stars
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true // Index for finding user projects
    },
    visibility: {
        type: String,
        enum: ['public', 'private'],
        default: 'public',
        index: true // Index for filtering public projects
    },
    videoUrl: String,
    downloadCount: {
        type: Number,
        default: 0,
        index: true // Index for sorting by downloads
    },
    views: {
        type: Number,
        default: 0,
        index: true // Index for sorting by views
    },
    starredBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    license: String,
    tags: {
        type: [String],
        index: true // Index for tag search
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true // Index for sorting new projects (very common)
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index for efficient public listings
ProjectSchema.index({ visibility: 1, createdAt: -1 });
ProjectSchema.index({ visibility: 1, views: -1 });
ProjectSchema.index({ visibility: 1, stars: -1 });

module.exports = mongoose.model('Project', ProjectSchema);
