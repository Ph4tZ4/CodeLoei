const mongoose = require('mongoose');
const Admin = require('./models/Admin');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const seedAdmin = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/it-student-repo'; // Correct DB name
        await mongoose.connect(mongoUri);
        console.log('MongoDB Connected');

        const admins = [
            { email: 'admin@it.ac.th', password: 'admin123', displayName: 'Super Admin' },
            { email: 'admin@codeloei.com', password: 'admin123', displayName: 'admin01' }
        ];

        for (const adminData of admins) {
            let admin = await Admin.findOne({ email: adminData.email });
            if (admin) {
                console.log(`Admin ${adminData.email} already exists`);
                const salt = await bcrypt.genSalt(10);
                admin.password = await bcrypt.hash(adminData.password, salt);
                admin.displayName = adminData.displayName;
                await admin.save();
                console.log(`Admin ${adminData.email} updated`);
            } else {
                admin = new Admin({
                    email: adminData.email,
                    password: adminData.password,
                    displayName: adminData.displayName
                });
                const salt = await bcrypt.genSalt(10);
                admin.password = await bcrypt.hash(adminData.password, salt);
                await admin.save();
                console.log(`Admin ${adminData.email} created`);
            }
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedAdmin();
