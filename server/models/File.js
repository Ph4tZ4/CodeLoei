const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
        index: true
    },
    path: {
        type: String, // e.g., "src/App.tsx" or "public/images"
        required: true
    },
    name: {
        type: String, // e.g., "App.tsx"
        required: true
    },
    content: {
        type: String, // For text files
        default: ''
    },
    size: {
        type: Number,
        default: 0
    },
    type: {
        type: String,
        enum: ['file', 'folder'],
        default: 'file'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index to ensure unique paths within a project
FileSchema.index({ project: 1, path: 1 }, { unique: true });

module.exports = mongoose.model('File', FileSchema);
