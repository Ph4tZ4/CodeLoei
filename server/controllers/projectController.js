const Project = require('../models/Project');
const File = require('../models/File');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');

// Get all projects (Public only)
// Get all projects (Public only)
exports.getProjects = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Only show public projects in the main feed
        const projects = await Project.find({ visibility: 'public' })
            .populate('ownerId', 'displayName photoURL isBanned')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(); // Use lean for faster reads

        res.json(projects);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get projects by user
exports.getProjectsByUser = async (req, res) => {
    try {
        const userId = req.params.userId;

        // Build query
        const query = { ownerId: userId };

        // Visibility check
        // If requester is NOT the target user, show only public
        // req.user might be null (if using authOptional) or set
        if (!req.user || req.user.id !== userId) {
            query.visibility = 'public';
        }

        const projects = await Project.find(query)
            .populate('ownerId', 'displayName photoURL isBanned')
            .sort({ createdAt: -1 })
            .lean(); // Faster read

        res.json(projects);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get single project
exports.getProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('ownerId', 'displayName photoURL isBanned');

        if (!project) return res.status(404).json({ msg: 'Project not found' });

        // Check visibility
        if (project.visibility === 'private') {
            // Need to be owner
            if (!req.user || project.ownerId._id.toString() !== req.user.id) {
                return res.status(403).json({ msg: 'Access denied. Private project.' });
            }
        }

        // Increment views (moved here to avoid incrementing on denied access)
        await Project.updateOne({ _id: project._id }, { $inc: { views: 1 } });
        project.views += 1; // Update local object to return correct count

        res.json(project);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') return res.status(404).json({ msg: 'Project not found' });
        res.status(500).send('Server Error');
    }
};

// Get popular projects (Example: Top 6 by weighted score)
exports.getPopularProjects = async (req, res) => {
    try {
        // Algorithm: Score = (Stars * 5) + (Downloads * 2) + (Views * 1)
        const projects = await Project.aggregate([
            { $match: { visibility: 'public' } },
            {
                $addFields: {
                    score: {
                        $add: [
                            { $multiply: [{ $ifNull: ["$stars", 0] }, 5] },
                            { $multiply: [{ $ifNull: ["$downloadCount", 0] }, 2] },
                            { $multiply: [{ $ifNull: ["$views", 0] }, 1] }
                        ]
                    }
                }
            },
            { $sort: { score: -1 } },
            { $limit: 6 },
            {
                $lookup: {
                    from: "users",
                    localField: "ownerId",
                    foreignField: "_id",
                    as: "owner"
                }
            },
            {
                $unwind: "$owner"
            },
            {
                $project: {
                    name: 1, description: 1, language: 1, stars: 1, downloadCount: 1, views: 1, score: 1, tags: 1, visibility: 1,
                    ownerId: { _id: "$owner._id", displayName: "$owner.displayName", photoURL: "$owner.photoURL", isBanned: "$owner.isBanned" }
                }
            }
        ]);
        res.json(projects);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Create a project
exports.createProject = async (req, res) => {
    try {
        const { name, description, language, visibility, license, tags, videoUrl } = req.body;

        // Check if user is authorized to create projects (only college members)
        if (req.user.userType !== 'college_member') {
            return res.status(403).json({ msg: 'Only college members can create projects' });
        }

        const newProject = new Project({
            name,
            description,
            language,
            visibility,
            license,
            tags,
            license,
            tags,
            videoUrl,
            ownerId: req.user.id
        });

        const project = await newProject.save();

        // Log Activity
        ActivityLog.create({
            user: req.user.id,
            action: 'create_project',
            project: project._id,
            details: `Created project '${project.name}'`
        }).catch(err => console.error("Activity Log Error:", err));

        // --- Initialize Repository Files ---
        const initFiles = [];

        // 1. README.md
        // Check if initReadme is true (it might come as a string "true" or boolean from frontend)
        if (req.body.initReadme === true || req.body.initReadme === 'true') {
            initFiles.push({
                project: project._id,
                path: 'README.md',
                name: 'README.md',
                content: `# ${name}\n\n${description || 'No description provided.'}`,
                type: 'file'
            });
        }

        // 2. .gitignore
        if (req.body.gitignore && req.body.gitignore !== 'None') {
            const templateName = req.body.gitignore;
            initFiles.push({
                project: project._id,
                path: '.gitignore',
                name: '.gitignore',
                content: `# Gitignore for ${templateName}\n\nnode_modules/\ndist/\n.env\n`, // Simplified template for now
                type: 'file'
            });
        }

        // 3. License
        if (license && license !== 'None') {
            initFiles.push({
                project: project._id,
                path: 'LICENSE',
                name: 'LICENSE',
                content: `${license}\n\nCopyright (c) ${new Date().getFullYear()} ${req.user.displayName}`,
                type: 'file'
            });
        }

        if (initFiles.length > 0) {
            await File.insertMany(initFiles);
        }

        res.json(project);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Update a project
exports.updateProject = async (req, res) => {
    try {
        const { name, description, language, visibility, license, tags, videoUrl } = req.body;

        let project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ msg: 'Project not found' });

        // Check user
        if (project.ownerId.toString() !== req.user.id && req.user.userType !== 'admin') {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        project = await Project.findByIdAndUpdate(
            req.params.id,
            { name, description, language, visibility, license, tags, videoUrl },
            { new: true }
        );

        res.json(project);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Delete a project
exports.deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ msg: 'Project not found' });

        // Check user
        if (project.ownerId.toString() !== req.user.id && req.user.userType !== 'admin') {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        await project.deleteOne();
        await File.deleteMany({ project: req.params.id });

        res.json({ msg: 'Project removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Upload file(s)
exports.uploadFiles = async (req, res) => {
    try {
        const { projectId, files } = req.body; // files array: [{ path, content, name, size, type }]

        let project = await Project.findById(projectId);
        if (!project) return res.status(404).json({ msg: 'Project not found' });

        if (project.ownerId.toString() !== req.user.id && req.user.userType !== 'admin') {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        const savedFiles = [];
        for (const file of files) {
            // Upsert file
            const savedFile = await File.findOneAndUpdate(
                { project: projectId, path: file.path },
                {
                    project: projectId,
                    path: file.path,
                    name: file.name,
                    content: file.content,
                    size: file.size || file.content.length,
                    type: file.type || 'file'
                },
                { new: true, upsert: true }
            );
            savedFiles.push(savedFile);
        }

        res.json(savedFiles);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Delete a file
exports.deleteFile = async (req, res) => {
    try {
        const { id } = req.params;
        const { path } = req.query;

        console.log("Deleting file:", id, path);

        if (!path) return res.status(400).json({ msg: 'File path is required' });

        const project = await Project.findById(id);
        if (!project) return res.status(404).json({ msg: 'Project not found' });

        if (project.ownerId.toString() !== req.user.id && req.user.userType !== 'admin') {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        const result = await File.findOneAndDelete({ project: id, path });

        if (!result) return res.status(404).json({ msg: 'File not found' });

        res.json({ msg: 'File deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get project files
exports.getProjectFiles = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ msg: 'Project not found' });

        // Check visibility
        if (project.visibility === 'private') {
            if (!req.user || project.ownerId.toString() !== req.user.id) {
                return res.status(403).json({ msg: 'Access denied' });
            }
        }

        const files = await File.find({ project: req.params.id }).select('-content'); // Don't send content for tree view
        res.json(files);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get specific file content
exports.getFileContent = async (req, res) => {
    try {
        const { id } = req.params;
        const { path } = req.query;

        if (path === undefined || path === null) return res.status(400).json({ msg: 'File path is required' });

        const project = await Project.findById(id);
        if (!project) return res.status(404).json({ msg: 'Project not found' });

        // Check visibility
        if (project.visibility === 'private') {
            if (!req.user || project.ownerId.toString() !== req.user.id) {
                return res.status(403).json({ msg: 'Access denied' });
            }
        }

        const file = await File.findOne({ project: id, path });
        if (!file) return res.status(404).json({ msg: 'File not found' });

        res.json(file);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Star project
exports.starProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ msg: 'Project not found' });

        // Toggle star
        if (project.starredBy.includes(req.user.id)) {
            project.starredBy = project.starredBy.filter(id => id.toString() !== req.user.id);
            project.stars = Math.max(0, project.stars - 1);
        } else {
            project.starredBy.push(req.user.id);
            project.stars += 1;
        }

        await project.save();

        // Log Activity if starred (not unstarred)
        if (project.starredBy.includes(req.user.id)) {
            ActivityLog.create({
                user: req.user.id,
                action: 'star',
                project: project._id,
                details: `Starred project '${project.name}'`
            }).catch(err => console.error("Activity Log Error:", err));
        }
        res.json({ stars: project.stars, starredBy: project.starredBy });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Download project (Increment count)
exports.downloadProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ msg: 'Project not found' });

        project.downloadCount += 1;
        await project.save();

        // Log Activity
        ActivityLog.create({
            user: req.user.id,
            action: 'download',
            project: project._id,
            details: `Downloaded project '${project.name}'`
        }).catch(err => console.error("Activity Log Error:", err));

        // In a real app we would generate a zip here
        // For now, we return specific file contents or a success message for client-side zipping
        const files = await File.find({ project: req.params.id });

        res.json({ msg: 'Download started', downloadCount: project.downloadCount, files });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// Get aggregated stats for Admin Dashboard
exports.getProjectStats = async (req, res) => {
    try {
        // 1. Language Distribution
        const langStats = await Project.aggregate([
            {
                $group: {
                    _id: "$language",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        // 2. Visibility Distribution
        const visibilityStats = await Project.aggregate([
            {
                $group: {
                    _id: "$visibility",
                    count: { $sum: 1 }
                }
            }
        ]);

        // 3. Top Projects by Views
        const topViewed = await Project.find()
            .sort({ views: -1 })
            .limit(5)
            .select('name views ownerId')
            .populate('ownerId', 'displayName');

        // 4. Top Projects by Stars
        const topStarred = await Project.find()
            .sort({ stars: -1 })
            .limit(5)
            .select('name stars ownerId')
            .populate('ownerId', 'displayName');

        // 5. Total Count
        const totalProjects = await Project.countDocuments();

        // 6. Popular Tags
        const popularTags = await Project.aggregate([
            { $unwind: "$tags" },
            {
                $group: {
                    _id: "$tags",
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        res.json({
            languageDistribution: langStats.map(s => ({ name: s._id || 'Unknown', value: s.count })),
            visibilityDistribution: visibilityStats.map(s => ({ name: s._id, value: s.count })),
            topViewed,
            topStarred,
            totalProjects,
            popularTags: popularTags.map(t => ({ name: t._id, value: t.count }))
        });

    } catch (err) {
        console.error("Stats Error:", err);
        res.status(500).send('Server Error');
    }
};

// Get Dashboard Stats
exports.getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id;
        // Total Views (from projects owned by user) - Assuming we track views on projects
        // For now, we don't have direct "View" count on Project model, we have History.
        // Let's aggregate from History where project belongs to user

        const projects = await Project.find({ ownerId: userId });
        const projectIds = projects.map(p => p._id);

        const History = require('../models/History'); // Import here to avoid circular dep issues if any
        const totalViews = await History.countDocuments({ project: { $in: projectIds } });

        const totalStars = projects.reduce((acc, curr) => acc + (curr.stars || 0), 0);
        const totalDownloads = projects.reduce((acc, curr) => acc + (curr.downloadCount || 0), 0);

        // Profile visits is tricky without a Visit model. We'll mock it or add it later.
        // For now return 0 or random for "mock" feel until strict requirement
        const profileVisits = 0;

        res.json({
            totalViews,
            totalStars,
            totalDownloads,
            profileVisits,
            // Growth stats would need historical data, sending 0 for now
            viewsGrowth: "+0%",
            starsGrowth: "+0%",
            downloadsGrowth: "+0%",
            visitsGrowth: "+0%"
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
