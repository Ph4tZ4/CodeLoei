const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const aiController = require('../controllers/aiController');

// Mock Request and Response
const req = {};
const res = {
    json: (data) => {
        console.log("Response JSON:", JSON.stringify(data, null, 2));
    },
    status: (code) => {
        console.log("Response Status:", code);
        return res; // chainable
    }
};

const testAI = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/code_loei_db';
        await mongoose.connect(mongoUri, { dbName: 'code_loei_db' });
        console.log('MongoDB Connected');

        console.log("\n--- Testing analyzeProjects ---");
        await aiController.analyzeProjects(req, res);

        console.log("\n--- Testing analyzeOverview ---");
        await aiController.analyzeOverview(req, res);

        process.exit();
    } catch (err) {
        console.error("Test Error:", err);
        process.exit(1);
    }
};

testAI();
