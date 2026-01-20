const mongoose = require('mongoose');
const History = require('../models/History');
const Project = require('../models/Project');
const User = require('../models/User');
const dotenv = require('dotenv');

dotenv.config();

const seedHistory = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/code_loei_db', {
            dbName: 'code_loei_db'
        });
        console.log('MongoDB Connected');

        // Get some users and projects
        const users = await User.find().limit(5);
        const projects = await Project.find().limit(5);

        if (users.length === 0 || projects.length === 0) {
            console.log('Not enough users or projects to seed history.');
            process.exit(0);
        }

        console.log('Clearing old history (optional)...');
        // await History.deleteMany({}); // Uncomment to clear old data

        const historyEntries = [];
        const now = new Date();

        // Generate data for the last 7 days
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(now.getDate() - i);

            // Random number of visits per day (5 to 20)
            const dailyVisits = Math.floor(Math.random() * 15) + 5;

            for (let j = 0; j < dailyVisits; j++) {
                const randomUser = users[Math.floor(Math.random() * users.length)];
                const randomProject = projects[Math.floor(Math.random() * projects.length)];

                // Spread visits throughout the day
                const visitTime = new Date(date);
                visitTime.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

                historyEntries.push({
                    user: randomUser._id,
                    project: randomProject._id,
                    viewedAt: visitTime
                });
            }
        }

        await History.insertMany(historyEntries);
        console.log(`Seeded ${historyEntries.length} history entries for the last 7 days.`);

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedHistory();
