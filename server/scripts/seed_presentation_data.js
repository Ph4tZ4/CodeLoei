const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
const File = require('../models/File');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const TARGET_EMAILS = ['67319010017@loeitech.ac.th', '67319010025@loeitech.ac.th'];

const MOCK_PROJECTS = [
    {
        name: 'Smart Dormitory IoT',
        description: 'An IoT-based system to control room lighting and air conditioning via a mobile dashboard. Uses ESP32 and MQTT.',
        language: 'C++',
        tags: ['IoT', 'ESP32', 'MQTT', 'Smart Home'],
        visibility: 'public',
        stars: 45,
        views: 320,
        downloadCount: 12,
        files: [
            { name: 'README.md', content: '# Smart Dorm\n\nControl your room from anywhere!' },
            { name: 'main.cpp', content: '#include <WiFi.h>\n\nvoid setup() {\n  // Init WiFi\n}' }
        ]
    },
    {
        name: 'Loei Canteen Queue',
        description: 'A mobile-first web application to order food and track queue status in the university canteen.',
        language: 'TypeScript',
        tags: ['React', 'Firebase', 'Mobile'],
        visibility: 'public',
        stars: 89,
        views: 1205,
        downloadCount: 56,
        files: [
            { name: 'README.md', content: '# Canteen Queue\n\nNo more standing in line.' },
            { name: 'App.tsx', content: 'export default function App() { return <div>Queue</div> }' }
        ]
    },
    {
        name: 'Alumni Connect',
        description: 'Social platform for Loei Tech alumni to network, find jobs, and share updates.',
        language: 'JavaScript',
        tags: ['Node.js', 'Express', 'Social'],
        visibility: 'public',
        stars: 23,
        views: 150,
        downloadCount: 5,
        files: [
            { name: 'README.md', content: '# Alumni Connect\n\nConnecting generations.' },
            { name: 'server.js', content: 'const express = require("express");\nconst app = express();' }
        ]
    },
    {
        name: 'Loei Travel Guide',
        description: 'Interactive map and guide for tourists visiting Loei province, featuring hidden gems and local food.',
        language: 'HTML/CSS',
        tags: ['Frontend', 'Travel', 'UI/UX'],
        visibility: 'public',
        stars: 67,
        views: 890,
        downloadCount: 34,
        files: [
            { name: 'index.html', content: '<h1>Welcome to Loei</h1>' },
            { name: 'style.css', content: 'body { background: #f0f0f0; }' }
        ]
    },
    {
        name: 'IT Helpdesk Ticketing',
        description: 'Internal system for students and staff to report technical issues to the IT center.',
        language: 'Python',
        tags: ['Django', 'Backend', 'Support'],
        visibility: 'private',
        stars: 12,
        views: 45,
        downloadCount: 0,
        files: [
            { name: 'README.md', content: '# Helpdesk\n\nInternal use only.' },
            { name: 'manage.py', content: '#!/usr/bin/env python' }
        ]
    },
    {
        name: 'Library Seat Booker',
        description: 'Real-time seat reservation system for the university library to prevent overcrowding.',
        language: 'Go',
        tags: ['Go', 'Concurrency', 'Real-time'],
        visibility: 'public',
        stars: 34,
        views: 210,
        downloadCount: 8,
        files: [
            { name: 'README.md', content: '# Seat Booker\n\nReserve your spot.' },
            { name: 'main.go', content: 'package main\n\nfunc main() {}' }
        ]
    },
    {
        name: 'Campus Bus Tracker',
        description: 'GPS tracking app for campus shuttle buses so students know exactly when the next bus matches.',
        language: 'Dart',
        tags: ['Flutter', 'GPS', 'Maps'],
        visibility: 'public',
        stars: 112,
        views: 2300,
        downloadCount: 150,
        files: [
            { name: 'README.md', content: '# Bus Tracker\n\nNever miss the bus again.' },
            { name: 'main.dart', content: 'void main() => runApp(MyApp());' }
        ]
    },
    {
        name: 'Used Book Market',
        description: 'Marketplace for students to buy and sell used textbooks within the college.',
        language: 'PHP',
        tags: ['Laravel', 'E-commerce', 'Database'],
        visibility: 'public',
        stars: 55,
        views: 400,
        downloadCount: 20,
        files: [
            { name: 'README.md', content: '# Book Market\n\nSave money on books.' },
            { name: 'artisan', content: '#!/usr/bin/env php' }
        ]
    }
];

const seedData = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/it-student-repo';
        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('MongoDB Connected');

        // 1. Get Users
        const users = await User.find({ email: { $in: TARGET_EMAILS } });
        if (users.length === 0) {
            console.error('No target users found! Please run cleanup/setup first.');
            process.exit(1);
        }
        console.log(`Found ${users.length} target users.`);

        // 2. Insert Projects
        let createdCount = 0;
        for (let i = 0; i < MOCK_PROJECTS.length; i++) {
            const mock = MOCK_PROJECTS[i];

            // Check if exists
            const existing = await Project.findOne({ name: mock.name });
            if (existing) {
                console.log(`Project ${mock.name} already exists. Skipping.`);
                continue;
            }

            // Round-robin assignment
            const owner = users[i % users.length];

            const project = new Project({
                name: mock.name,
                description: mock.description,
                language: mock.language,
                tags: mock.tags,
                visibility: mock.visibility,
                stars: mock.stars,
                views: mock.views,
                downloadCount: mock.downloadCount,
                ownerId: owner._id,
                createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)), // Random past date
                updatedAt: new Date()
            });

            const savedProject = await project.save();

            // 3. Create Files
            for (const f of mock.files) {
                await File.create({
                    project: savedProject._id,
                    name: f.name,
                    path: f.name, // Simple root path
                    content: f.content,
                    size: f.content.length,
                    type: 'file'
                });
            }

            console.log(`Created project: ${mock.name} (Owner: ${owner.email})`);
            createdCount++;
        }

        console.log(`Seeding complete. Created ${createdCount} new projects.`);
        process.exit();

    } catch (err) {
        console.error('Error seeding data:', err);
        process.exit(1);
    }
};

seedData();
