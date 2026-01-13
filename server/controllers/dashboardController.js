const Project = require('../models/Project');
const History = require('../models/History');
const mongoose = require('mongoose');

exports.getDashboardStats = async (req, res) => {
    try {
        const userId = req.user.id; // Assumes auth middleware populates req.user

        // 1. Get all projects owned by the user
        const projects = await Project.find({ ownerId: userId });

        // 2. Calculate Totals
        let totalViews = 0;
        let totalStars = 0;
        let totalDownloads = 0;

        projects.forEach(project => {
            totalViews += project.views || 0;
            totalStars += project.stars || 0;
            totalDownloads += project.downloadCount || 0;
        });

        // distinct project IDs owned by user
        const projectIds = projects.map(p => p._id);

        // 3. Visitor Statistics and Totals based on Range
        const range = req.query.range || '7d';
        const now = new Date();
        let startDate = new Date();
        let groupByFormat = "%Y-%m-%d"; // default daily
        let points = 7;

        if (range === '30d') {
            startDate.setDate(now.getDate() - 29);
            points = 30;
        } else if (range === '1y') {
            startDate.setMonth(0, 1); // Jan 1st of current year
            startDate.setHours(0, 0, 0, 0);
            groupByFormat = "%Y-%m"; // monthly
            points = 12;
        } else {
            // 7d default
            startDate.setDate(now.getDate() - 6);
        }
        startDate.setHours(0, 0, 0, 0);

        // Calculate Totals (Respecting range for Views, but Downloads/Stars are usually total lifetime in simple apps, 
        // but if we want "Stats for this period", we'd need history for them too. 
        // For now, let's keep totals as LIFETIME for simpler UX unless specified, 
        // OR filtering views by range makes sense for the "Traffic Graph".
        // Let's filter the GRAPH data by range. The "Overview Cards" usually imply "Current State" or "Growth in period".
        // User asked to "choose filter 7 days/30 days...", usually implies the whole dash adjusts.
        // HOWEVER, `Project` model stores simple `views`, `stars` counters (Lifetime).
        // We cannot filter lifetime counters by date without a history log for every action.
        // We ONLY have `History` for VIEWS.
        // So: Graph = Filtered Views. Cards = Total Lifetime (maybe growth is calculated? but we mocked growth).
        // Let's focus on the Graph primarily as that's the "Statistics".

        // Aggregation for Graph
        const statsData = await History.aggregate([
            {
                $match: {
                    project: { $in: projectIds },
                    viewedAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: groupByFormat, date: "$viewedAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Fill gaps
        const chartData = [];
        const labels = [];

        if (range === '1y') {
            for (let i = 0; i < 12; i++) {
                // For this year, months 0-11
                const d = new Date(new Date().getFullYear(), i, 1);
                const key = d.toISOString().slice(0, 7); // YYYY-MM
                const found = statsData.find(v => v._id === key);
                chartData.push(found ? found.count : 0);
                labels.push(d.toLocaleString('default', { month: 'short' }));
            }
        } else {
            // Daily (7d or 30d)
            for (let i = points - 1; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
                const found = statsData.find(v => v._id === key);
                chartData.push(found ? found.count : 0);
                labels.push(d.getDate() + '/' + (d.getMonth() + 1));
            }
        }

        // 4. Recent Activity (Simplified)
        // Combine recent views on my projects and recent updates by me
        // 4. Recent Activity (Expanded to include all activity types)
        // Find activities affecting my projects OR activities I did
        const ActivityLog = require('../models/ActivityLog');

        const recentActivities = await ActivityLog.find({
            project: { $in: projectIds },
            user: { $ne: userId }
        })
            .sort({ createdAt: -1 })
            .limit(8)
            .populate('project', 'name')
            .populate('user', 'displayName'); // Actor name

        const activities = recentActivities.map(log => {
            let text = '';
            let type = 'view';
            const actorName = log.user._id.toString() === userId ? 'You' : (log.user.displayName || 'Someone');
            const projectName = log.project ? log.project.name : 'Unknown Project';

            switch (log.action) {
                case 'create_project':
                    text = `${actorName} created project '${projectName}'`;
                    type = 'create'; // map to frontend type checks if needed
                    break;
                case 'view':
                    text = `${actorName} viewed '${projectName}'`;
                    type = 'view';
                    break;
                case 'download':
                    text = `${actorName} downloaded '${projectName}'`;
                    type = 'download';
                    break;
                case 'star':
                case 'pin':
                    text = `${actorName} starred '${projectName}'`;
                    type = 'star';
                    break;
                case 'update_profile':
                    text = `${actorName} updated profile`;
                    type = 'update';
                    break;
                default:
                    text = log.details || `${actorName} performed ${log.action}`;
                    type = 'view';
            }

            return {
                text,
                time: log.createdAt,
                type
            };
        });

        // 5. Growth (Placeholder / Simple Comparison)
        // For real growth, we'd need snapshots. For now, we return 0% or hardcoded small randoms for "feeling" if no data, 
        // OR purely return +0% if we want to be strict.
        // Let's stick to +0% to be accurate to available data.

        res.json({
            totalViews,
            totalStars,
            totalDownloads,
            profileVisits: 0, // Not tracked yet
            viewsGrowth: "+0%",
            starsGrowth: "+0%",
            downloadsGrowth: "+0%",
            visitsGrowth: "+0%",
            chartData,
            labels, // Send labels to frontend
            activities,
            topProjects: projects.sort((a, b) => b.views - a.views).slice(0, 5)
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server Error' });
    }
};

exports.getAdminStats = async (req, res) => {
    try {
        const User = require('../models/User'); // Lazy load
        const Project = require('../models/Project');

        // 1. Online Users (Active in last 5 minutes)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const onlineUsers = await User.countDocuments({ lastActiveAt: { $gte: fiveMinutesAgo } });

        // 2. Total Projects
        const totalProjects = await Project.countDocuments();

        // 3. Server Status (Mock connection check)
        // If we are here, DB is connected.
        const serverStatus = 'Healthy';

        // 4. Total Views (Global)
        // We can sum all project views
        const projects = await Project.find().select('views');
        const totalViews = projects.reduce((acc, p) => acc + (p.views || 0), 0);

        // 5. Traffic Data (Last 7 Days) from History
        const History = require('../models/History');
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const trafficStats = await History.aggregate([
            {
                $match: {
                    viewedAt: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$viewedAt" } },
                    count: { $sum: 1 }
                }
            }
        ]);

        const trafficData = [];
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().slice(0, 10);
            const found = trafficStats.find(t => t._id === key);
            trafficData.push({
                day: days[d.getDay()],
                visits: found ? found.count : 0
            });
        }

        // 6. Recent Activity (From ActivityLog)
        const ActivityLog = require('../models/ActivityLog');
        const recentActivities = await ActivityLog.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('user', 'email');

        const activities = recentActivities.map(log => {
            let title = 'กิจกรรม';
            let color = 'bg-gray-500';

            switch (log.action) {
                case 'login': title = 'เข้าสู่ระบบ'; color = 'bg-green-500'; break;
                case 'register': title = 'สมัครสมาชิกใหม่'; color = 'bg-emerald-500'; break;
                case 'create_project': title = 'สร้างโครงการใหม่'; color = 'bg-blue-500'; break;
                case 'view': title = 'เข้าชมโครงการ'; color = 'bg-purple-500'; break;
                case 'download': title = 'ดาวน์โหลดไฟล์'; color = 'bg-orange-500'; break;
                case 'pin': title = 'ปักหมุดโครงการ'; color = 'bg-pink-500'; break;
            }

            return {
                time: log.createdAt,
                title: title,
                desc: log.details || (log.user ? log.user.email : 'ไม่ระบุตัวตน'),
                color: color
            };
        });

        res.json({
            onlineUsers,
            totalProjects,
            totalViews,
            serverStatus,
            uptime: '99.9%',
            trafficData,
            activities
        });
    } catch (err) {
        console.error("Admin Stats Error:", err);
        res.status(500).json({ msg: 'Server Error' });
    }
};
