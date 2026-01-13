const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { classifyUserType } = require('../utils/userHelpers');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.register = async (req, res) => {
    const { email, password, displayName } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        const userType = classifyUserType(email);
        const userFields = {
            email,
            password,
            displayName: displayName || email.split('@')[0],
            username: email.split('@')[0] + Math.floor(1000 + Math.random() * 9000), // Append random 4 digits to ensure uniqueness
            userType
        };

        if (userType === 'college_member') {
            const sid = email.split('@')[0];
            if (sid) userFields.studentId = sid;
        }

        user = new User(userFields);

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        const payload = {
            user: {
                id: user.id
            }
        };

        // Log Activity
        ActivityLog.create({
            user: user.id,
            action: 'register',
            details: `User ${user.email} registered.`
        }).catch(err => console.error("Activity Log Error:", err));

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret',
            { expiresIn: 360000 },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, email: user.email, displayName: user.displayName, userType: user.userType } });
            }
        );
    } catch (err) {
        console.error("Register Error:", err);
        if (err.code === 11000) {
            const field = Object.keys(err.keyValue)[0];
            return res.status(400).json({ msg: `User already exists (${field} is duplicate)` });
        }
        // Send JSON error to ensure frontend parses it correctly
        res.status(500).json({ msg: 'Server error: ' + err.message });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Check for user by email OR displayName
        let user = await User.findOne({
            $or: [
                { email: email },
                { displayName: email }
            ]
        });

        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // If user has no password (e.g. google only), return error
        if (!user.password) {
            return res.status(400).json({ msg: 'Please log in with Google' });
        }

        // Check Ban Status
        if (user.isBanned) {
            if (user.bannedUntil && new Date(user.bannedUntil) > new Date()) {
                return res.status(403).json({
                    msg: `Account suspended until ${new Date(user.bannedUntil).toLocaleDateString()}. Reason: ${user.banReason || 'Violation of terms'}`
                });
            } else {
                // Ban expired, unban logic could go here or just allow login
                // Ideally, we should clean up the ban status
                user.isBanned = false;
                user.bannedUntil = null;
                user.banReason = null;
                await user.save();
            }
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const payload = {
            user: {
                id: user.id
            }
        };

        // Log Activity
        ActivityLog.create({
            user: user.id,
            action: 'login',
            details: `User ${user.email} logged in.`
        }).catch(err => console.error("Activity Log Error:", err));

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret',
            { expiresIn: 360000 },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, email: user.email, displayName: user.displayName, photoURL: user.photoURL, userType: user.userType } });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.googleLogin = async (req, res) => {
    const { credential } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });
        const { email, name, picture, sub } = ticket.getPayload();

        let user = await User.findOne({ email });

        if (user) {
            // Update existing user
            user.displayName = name || user.displayName;
            user.photoURL = picture || user.photoURL;
            // Update googleId if not present
            if (!user.googleId) {
                user.googleId = sub;
            }

            // Check Ban Status
            if (user.isBanned) {
                if (user.bannedUntil && new Date(user.bannedUntil) > new Date()) {
                    return res.status(403).json({
                        msg: `Account suspended until ${new Date(user.bannedUntil).toLocaleDateString()}. Reason: ${user.banReason || 'Violation of terms'}`
                    });
                } else {
                    user.isBanned = false;
                    user.bannedUntil = null;
                    user.banReason = null;
                }
            }

            // Re-classify user type based on email to ensure accuracy
            user.userType = classifyUserType(email);

            // If they are now a college member (or were), ensure studentId is set if missing
            if (user.userType === 'college_member' && !user.studentId) {
                const sid = email.split('@')[0];
                if (sid) user.studentId = sid;
            }

            await user.save();
        } else {
            // Create new user
            const userType = classifyUserType(email);

            const userFields = {
                email,
                displayName: name,
                photoURL: picture,
                googleId: sub,
                userType,
                username: email.split('@')[0] + Math.floor(1000 + Math.random() * 9000) // Fallback username with random suffix
            };

            if (userType === 'college_member') {
                const sid = email.split('@')[0];
                if (sid) userFields.studentId = sid;
            }

            console.log("Creating Google User with fields:", userFields);

            user = new User(userFields);
            await user.save();
        }

        const payload = {
            user: {
                id: user.id
            }
        };

        // Log Activity
        ActivityLog.create({
            user: user.id,
            action: 'login',
            details: `User ${user.email} logged in via Google.`
        }).catch(err => console.error("Activity Log Error:", err));

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret',
            { expiresIn: 360000 },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, email: user.email, displayName: user.displayName, photoURL: user.photoURL, userType: user.userType } });
            }
        );

    } catch (err) {
        console.error("Google Auth Error:", err);
        // Return JSON error so frontend handles it gracefully
        res.status(400).json({ msg: 'Google Login Failed: ' + err.message });
    }
};

exports.getMe = async (req, res) => {
    try {
        // Use _id as fallback if id is missing (POJO vs Mongoose Document)
        const userId = req.user.id || req.user._id;
        console.log('getMe called for user:', userId, 'role:', req.user.role);

        let user;
        if (req.user.role === 'admin') {
            const Admin = require('../models/Admin');
            user = await Admin.findById(userId).select('-password');
            if (user) {
                user = user.toObject();
                user.role = 'admin';
                user.userType = 'admin';
            }
        } else {
            user = await User.findById(userId).select('-password').populate('pinnedProjects');
            // Check ban on token validation/persistence
            if (user && user.isBanned) {
                if (user.bannedUntil && new Date(user.bannedUntil) > new Date()) {
                    return res.status(403).json({ msg: 'Account suspended' });
                }
            }
        }
        console.log('getMe returning:', user ? user.email : 'null');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
