const mongoose = require('mongoose');

const HistorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    viewedAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index to ensure efficient queries for user's history sorted by time
HistorySchema.index({ user: 1, viewedAt: -1 });

// TTL Index: Automatically expire (delete) documents after 3 days (259200 seconds)
HistorySchema.index({ viewedAt: 1 }, { expireAfterSeconds: 259200 });

module.exports = mongoose.model('History', HistorySchema);
