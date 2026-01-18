const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { bio, location, website, publicEmail, skills, displayName, photoURL } = req.body;

        const userFields = {};
        if (bio !== undefined) userFields.bio = bio;
        if (location !== undefined) userFields.location = location;
        if (website !== undefined) userFields.website = website;
        if (publicEmail !== undefined) userFields.publicEmail = publicEmail;
        if (skills !== undefined) {
            userFields.skills = Array.isArray(skills) ? skills : (skills ? skills.split(',').map(skill => skill.trim()) : []);
        }
        if (displayName) userFields.displayName = displayName;
        if (photoURL !== undefined) userFields.photoURL = photoURL;

        let user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        user = await User.findByIdAndUpdate(
            req.user.id,
            { $set: userFields },
            { new: true }
        ).select('-password');

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.togglePinProject = async (req, res) => {
    try {
        const { projectId } = req.body;
        const user = await User.findById(req.user.id);

        if (user.pinnedProjects.includes(projectId)) {
            user.pinnedProjects = user.pinnedProjects.filter(id => id.toString() !== projectId);
        } else {
            if (user.pinnedProjects.length >= 6) {
                return res.status(400).json({ msg: 'Maximum 6 pinned projects allowed' });
            }
            user.pinnedProjects.push(projectId);

            // Log Activity (Only on pin)
            ActivityLog.create({
                user: req.user.id,
                action: 'pin',
                project: projectId,
                details: `Pinned a project`
            }).catch(err => console.error("Activity Log Error:", err));
        }

        await user.save();
        res.json(user.pinnedProjects);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getPublicProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password -email -googleId') // Exclude sensitive info
            .populate('pinnedProjects');

        if (!user) return res.status(404).json({ msg: 'User not found' });

        const profileData = {
            _id: user._id,
            displayName: user.displayName,
            photoURL: user.photoURL,
            bio: user.bio,
            skills: user.skills,
            location: user.location,
            website: user.website,
            publicEmail: user.publicEmail,
            pinnedProjects: user.pinnedProjects,
            followersCount: user.followers ? user.followers.length : 0,
            followingCount: user.following ? user.following.length : 0,
            createdAt: user.createdAt,
            userType: user.userType,
            isBanned: user.isBanned,
            bannedUntil: user.bannedUntil
        };

        // Check isFollowing if auth token provided (handled by middleware if applied?)
        // Since this might be a public route, middleware 'auth' might strictly require token.
        // We might need a separate check or duplicate route logic.
        // For simplicity, if req.user exists (from auth middleware), we check.
        if (req.user) {
            profileData.isFollowing = user.followers && user.followers.includes(req.user.id);
        }

        res.json(profileData);
    } catch (err) {
        console.error(err.message);
        if (err.kind == 'ObjectId') {
            return res.status(404).json({ msg: 'User not found' });
        }
        res.status(500).send('Server Error');
    }
};

exports.toggleFollow = async (req, res) => {
    try {
        const targetUserId = req.params.id;
        const currentUserId = req.user.id; // From auth middleware

        if (targetUserId === currentUserId) {
            return res.status(400).json({ msg: 'Cannot follow yourself' });
        }

        const targetUser = await User.findById(targetUserId);
        const currentUser = await User.findById(currentUserId);

        if (!targetUser || !currentUser) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Initialize arrays if they don't exist (schema update should handle, but safety)
        if (!targetUser.followers) targetUser.followers = [];
        if (!currentUser.following) currentUser.following = [];

        const isFollowing = targetUser.followers.includes(currentUserId);

        if (isFollowing) {
            // Unfollow
            targetUser.followers = targetUser.followers.filter(id => id.toString() !== currentUserId);
            currentUser.following = currentUser.following.filter(id => id.toString() !== targetUserId);
        } else {
            // Follow
            targetUser.followers.push(currentUserId);
            currentUser.following.push(targetUserId);
        }

        await targetUser.save();
        await currentUser.save();

        res.json({
            isFollowing: !isFollowing,
            followersCount: targetUser.followers.length
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// --- Admin Only Methods ---

// Get all users (Admin)
exports.getAllUsers = async (req, res) => {
    try {
        if (req.user.userType !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Delete user (Admin)
exports.deleteUser = async (req, res) => {
    try {
        if (req.user.userType !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        await User.findByIdAndDelete(req.params.id);
        // Clean up related data? For now just user.
        // Ideally should remove their projects too, but maybe preserve for archiving? 
        // Let's keep projects for now, or maybe they become orphaned.
        // A better approach: Delete their projects.
        const Project = require('../models/Project');
        await Project.deleteMany({ ownerId: req.params.id });

        res.json({ msg: 'User removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Update user by Admin (Admin)
exports.updateUserByAdmin = async (req, res) => {
    try {
        if (req.user.userType !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const { bio, location, website, publicEmail, skills, displayName, photoURL, userType } = req.body;

        const userFields = {};
        if (bio !== undefined) userFields.bio = bio;
        if (location !== undefined) userFields.location = location;
        if (website !== undefined) userFields.website = website;
        if (publicEmail !== undefined) userFields.publicEmail = publicEmail;
        if (skills !== undefined) {
            userFields.skills = Array.isArray(skills) ? skills : (skills ? skills.split(',').map(skill => skill.trim()) : []);
        }
        if (displayName) userFields.displayName = displayName;
        if (photoURL !== undefined) userFields.photoURL = photoURL;
        if (userType) userFields.userType = userType; // Admin can change roles

        let user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: userFields },
            { new: true }
        ).select('-password');

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Ban User (Admin)
exports.banUser = async (req, res) => {
    try {
        if (req.user.userType !== 'admin') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const { duration, reason, customDate } = req.body;
        const userId = req.params.id;

        let bannedUntil = null;
        const now = new Date();

        // Duration calculation
        switch (duration) {
            case '1day':
                bannedUntil = new Date(now.setDate(now.getDate() + 1));
                break;
            case '7days':
                bannedUntil = new Date(now.setDate(now.getDate() + 7));
                break;
            case '1month':
                bannedUntil = new Date(now.setMonth(now.getMonth() + 1));
                break;
            case '3months':
                bannedUntil = new Date(now.setMonth(now.getMonth() + 3));
                break;
            case '6months':
                bannedUntil = new Date(now.setMonth(now.getMonth() + 6));
                break;
            case '1year':
                bannedUntil = new Date(now.setFullYear(now.getFullYear() + 1));
                break;
            case 'lifetime':
                bannedUntil = new Date(9999, 11, 31); // Far future
                break;
            case 'custom':
                if (!customDate) return res.status(400).json({ msg: 'Custom date required' });
                bannedUntil = new Date(customDate);
                break;
            case 'unban':
                bannedUntil = null;
                break;
            default:
                if (duration !== 'unban') return res.status(400).json({ msg: 'Invalid duration' });
        }

        const isBanned = duration !== 'unban';

        const user = await User.findByIdAndUpdate(
            userId,
            {
                isBanned,
                bannedUntil,
                banReason: reason || ''
            },
            { new: true }
        ).select('-password');

        if (!user) return res.status(404).json({ msg: 'User not found' });

        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Delete own account (User)
exports.deleteMe = async (req, res) => {
    try {
        // req.user.id comes from auth middleware
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        // Delete the user
        await User.findByIdAndDelete(userId);

        // Delete their projects
        const Project = require('../models/Project');
        await Project.deleteMany({ ownerId: userId });

        res.json({ msg: 'User deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
