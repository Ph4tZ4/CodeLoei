const axios = require('axios');
const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const BASE_URL = 'http://localhost:8000/api';

// Mocks for login (since we can't easily interface with the real Google login via script purely locally without a token)
// Actually, we can just *generate* a token using jsonwebtoken since we have the secret!
const jwt = require('jsonwebtoken');

const debugAccess = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/it-student-repo';
        await mongoose.connect(mongoUri);
        console.log('MongoDB Connected');

        // 1. Get a User
        const user = await User.findOne({ email: '67319010017@loeitech.ac.th' });
        if (!user) {
            console.error('User not found');
            process.exit(1);
        }

        // 2. Generate a fresh Token
        const payload = {
            user: {
                id: user.id,
                userType: user.userType
            }
        };
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
        console.log('Generated Token for user:', user.email);

        // 3. Create a Private Project (directly in DB to ensure it exists)
        let project = await Project.findOne({ name: 'DebugPrivateProject' });
        if (!project) {
            project = new Project({
                name: 'DebugPrivateProject',
                description: 'Private debugging project',
                visibility: 'private',
                ownerId: user.id
            });
            await project.save();
            console.log('Created Private Project:', project._id);
        } else {
            // Ensure visibility is private
            if (project.visibility !== 'private') {
                project.visibility = 'private';
                await project.save();
            }
            console.log('Using existing Private Project:', project._id);
        }

        // 4. Attempt to Access via API (getProject)
        try {
            const res = await axios.get(`${BASE_URL}/projects/${project._id}`, {
                headers: { 'x-auth-token': token }
            });
            console.log(`[SUCCESS] Get Project: Status ${res.status}`);
            console.log('Project Name:', res.data.name);
        } catch (err) {
            console.error(`[FAILED] Get Project: Status ${err.response?.status}`);
            console.error('Data:', err.response?.data);
        }

        // 5. Attempt to Access Files (getProjectFiles)
        try {
            const res = await axios.get(`${BASE_URL}/projects/${project._id}/files`, {
                headers: { 'x-auth-token': token }
            });
            console.log(`[SUCCESS] Get Files: Status ${res.status}`);
            console.log('Files count:', res.data.length);
        } catch (err) {
            console.error(`[FAILED] Get Files: Status ${err.response?.status}`);
            console.error('Data:', err.response?.data);
        }

        process.exit();

    } catch (err) {
        console.error('Script Error:', err);
        process.exit(1);
    }
};

debugAccess();
