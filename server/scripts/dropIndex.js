
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/it-student-repo');
        console.log('MongoDB Connected');

        try {
            await mongoose.connection.collection('users').dropIndex('studentId_1');
            console.log('SUCCESS: Dropped index studentId_1');
        } catch (error) {
            if (error.codeName === 'IndexNotFound') {
                console.log('NOTE: Index studentId_1 not found (already dropped?)');
            } else {
                console.error('ERROR dropping index:', error.message);
            }
        }

        process.exit();
    } catch (err) {
        console.error('Database connection error:', err.message);
        process.exit(1);
    }
};

connectDB();
