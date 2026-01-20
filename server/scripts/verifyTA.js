const mongoose = require('mongoose');
const User = require('../models/User');
const Admin = require('../models/Admin');
require('dotenv').config({ path: '../.env' });

const verifyTA = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/code_loei_db';
        await mongoose.connect(mongoUri, { dbName: 'code_loei_db' });

        const email = 'ta01@codeloei.com';

        console.log(`Verifying ${email}...`);

        const user = await User.findOne({ email });
        console.log('User found:', !!user);
        if (user) {
            console.log('User isVerified:', user.isVerified);
            console.log('User password exists:', !!user.password);
        }

        const admin = await Admin.findOne({ email });
        console.log('Admin found:', !!admin);
        if (admin) {
            console.log('Admin role:', admin.role);
            console.log('Admin password exists:', !!admin.password);
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

verifyTA();
