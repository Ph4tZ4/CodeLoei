const mongoose = require('mongoose');

const NewsSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['ACADEMIC', 'SYSTEM UPDATE', 'EVENT', 'ANNOUNCEMENT', 'ACTIVITY', 'SCHOLARSHIP']
    },
    categoryColor: {
        type: String,
        default: 'text-blue-400'
    },
    coverImage: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('News', NewsSchema);
