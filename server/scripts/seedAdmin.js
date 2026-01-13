const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const path = require('path');

// Load env from server directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/code_loei_db');
        console.log('MongoDB Connected');

        const email = 'admin@codeloei.com';
        const password = 'admin123';
        const displayName = 'Super Admin';

        let admin = await Admin.findOne({ email });
        if (admin) {
            console.log('Admin already exists');
            process.exit(0);
        }

        admin = new Admin({
            email,
            password,
            displayName,
            role: 'admin'
        });

        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(password, salt);

        await admin.save();
        console.log(`Admin created: ${email} / ${password}`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedAdmin();
