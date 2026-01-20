const mongoose = require('mongoose');
const User = require('../models/User'); // Adjust path relative to script location
const Admin = require('../models/Admin'); // Adjust path relative to script location
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '../.env' }); // Load env from parent directory

const seedTA = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/code_loei_db';
        await mongoose.connect(mongoUri, { dbName: 'code_loei_db' });
        console.log(`MongoDB Connected: ${mongoUri}`);

        for (let i = 1; i <= 9; i++) {
            const num = i.toString().padStart(2, '0');
            const email = `ta${num}@codeloei.com`;
            const password = `ta${num}`;
            const displayName = `ta${num}`;
            const studentId = `ta${num}`;

            console.log(`Processing ${email}...`);

            // --- USER (Client) ---
            let user = await User.findOne({ email });
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const userFields = {
                email,
                password: hashedPassword,
                displayName,
                username: displayName,
                userType: 'college_member',
                studentId,
                isVerified: true, // Bypass OTP
                otp: undefined,
                otpExpires: undefined
            };

            if (user) {
                // Update existing user
                user.password = hashedPassword;
                user.displayName = displayName;
                user.userType = 'college_member';
                user.studentId = studentId;
                user.isVerified = true;
                user.otp = undefined;
                user.otpExpires = undefined;
                await user.save();
                console.log(`  [User] Updated`);
            } else {
                // Create new user
                user = new User(userFields);
                await user.save();
                console.log(`  [User] Created`);
            }

            // --- ADMIN (Admin Panel) ---
            let admin = await Admin.findOne({ email });

            if (admin) {
                // Update existing admin
                admin.password = hashedPassword;
                admin.displayName = displayName;
                admin.role = 'admin';
                await admin.save();
                console.log(`  [Admin] Updated`);
            } else {
                // Create new admin
                admin = new Admin({
                    email,
                    password: hashedPassword,
                    displayName,
                    role: 'admin'
                });
                await admin.save();
                console.log(`  [Admin] Created`);
            }
        }

        console.log('Seed TA completed successfully.');
        process.exit();
    } catch (err) {
        console.error('Seed TA Error:', err);
        process.exit(1);
    }
};

seedTA();
