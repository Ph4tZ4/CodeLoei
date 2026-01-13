const History = require('../models/History');
const Project = require('../models/Project');
const ActivityLog = require('../models/ActivityLog');

// Record a project view
exports.recordView = async (req, res) => {
    try {
        const { projectId } = req.body;
        const userId = req.user.id;

        if (!projectId) {
            return res.status(400).json({ msg: 'Project ID is required' });
        }

        // Check if project exists
        const project = await Project.findById(projectId);
        if (!project) {
            return res.status(404).json({ msg: 'Project not found' });
        }

        // Upsert history record
        let history = await History.findOne({ user: userId, project: projectId });

        if (history) {
            history.viewedAt = Date.now();
            await history.save();
        } else {
            history = new History({
                user: userId,
                project: projectId,
                viewedAt: Date.now()
            });
            await history.save();
        }

        // Log Activity
        ActivityLog.create({
            user: userId,
            action: 'view',
            project: projectId,
            details: `Viewed project '${project.name}'`
        }).catch(err => console.error("Activity Log Error:", err));

        res.json(history);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get browsing history for user
exports.getHistory = async (req, res) => {
    try {
        const userId = req.user.id;

        const history = await History.find({ user: userId })
            .sort({ viewedAt: -1 })
            .sort({ viewedAt: -1 })
            .populate({
                path: 'project',
                populate: { path: 'ownerId', select: 'displayName photoURL' }
            })
            .limit(50); // Limit to last 50 viewed items

        res.json(history);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
