const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { classifyUserType } = require('../utils/userHelpers');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

exports.register = async (req, res) => {
    const { email, password, displayName } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            // If user exists but not verified, resend OTP
            if (!user.isVerified) {
                const otp = Math.floor(10000 + Math.random() * 90000).toString(); // 5 digit OTP
                user.otp = otp;
                user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 mins

                // Update info if changed
                if (password) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(password, salt);
                }
                if (displayName) user.displayName = displayName;

                await user.save();

                await sendEmail({
                    email: user.email,
                    subject: 'CodeLoei Verification Code',
                    message: `Your verification code is: <b>${otp}</b>. It expires in 10 minutes.`
                });

                return res.json({ msg: 'OTP Sent', email: user.email, requireOtp: true });
            }
            return res.status(400).json({ msg: 'User already exists' });
        }

        const userType = classifyUserType(email);
        const userFields = {
            email,
            password,
            displayName: displayName || email.split('@')[0],
            username: email.split('@')[0] + Math.floor(1000 + Math.random() * 9000),
            userType,
            isVerified: false // Default false
        };

        if (userType === 'college_member') {
            const sid = email.split('@')[0];
            if (sid) userFields.studentId = sid;
        }

        user = new User(userFields);

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        // Generate OTP
        const otp = Math.floor(10000 + Math.random() * 90000).toString();
        user.otp = otp;
        user.otpExpires = Date.now() + 10 * 60 * 1000;

        await user.save();

        // Send Email
        try {
            await sendEmail({
                email: user.email,
                subject: 'CodeLoei Verification Code',
                message: `Your verification code is: <b>${otp}</b>. It expires in 10 minutes.`
            });
        } catch (emailErr) {
            console.error("Email send failed", emailErr);
            // Delete user if email fails? Or allow retry.
            // For now, allow retry (user exists but unverified)
            return res.status(500).json({ msg: 'Error sending email. Please try again.' });
        }

        res.json({ msg: 'OTP Sent', email: user.email, requireOtp: true });

    } catch (err) {
        console.error("Register Error:", err);
        res.status(500).json({ msg: 'Server error: ' + err.message });
    }
};

exports.verifyOTP = async (req, res) => {
    const { email, otp } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ msg: 'User not found' });

        if (user.isVerified) return res.status(400).json({ msg: 'User already verified' });

        if (user.otp !== otp) {
            return res.status(400).json({ msg: 'Invalid OTP' });
        }

        if (user.otpExpires < Date.now()) {
            return res.status(400).json({ msg: 'OTP Expired' });
        }

        // OTP Valid
        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        // Login Logic (Return Token)
        const payload = { user: { id: user.id } };

        // Log Activity
        ActivityLog.create({
            user: user.id,
            action: 'register',
            details: `User ${user.email} verified and registered.`
        }).catch(err => console.error("Log Error:", err));

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
        console.error("Verify OTP Error:", err);
        res.status(500).send('Server error');
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

        // Check if verified
        if (user.isVerified === false) {
            return res.status(403).json({ msg: 'Please verify your email first.' });
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
