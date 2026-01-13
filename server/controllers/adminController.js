const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        let admin = await Admin.findOne({ email });

        if (!admin) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, admin.password);

        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const payload = {
            user: {
                id: admin.id,
                role: 'admin' // Important for frontend to distinguish
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '12h' }, // Longer session for admin?
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: {
                        _id: admin.id,
                        displayName: admin.displayName,
                        email: admin.email,
                        photoURL: admin.photoURL,
                        role: 'admin',
                        userType: 'admin' // For frontend compatibility
                    }
                });
            }
        );
    } catch (err) {
        console.error('Admin Login Error:', err);
        console.error('Stack:', err.stack);
        res.status(500).json({ msg: 'Server Error', error: err.message });
    }
};

// Internal use primarily
exports.createAdmin = async (req, res) => {
    const { email, password, displayName } = req.body;
    try {
        let admin = await Admin.findOne({ email });
        if (admin) {
            return res.status(400).json({ msg: 'Admin already exists' });
        }

        admin = new Admin({
            email,
            password,
            displayName
        });

        const salt = await bcrypt.genSalt(10);
        admin.password = await bcrypt.hash(password, salt);

        await admin.save();
        res.json(admin);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
