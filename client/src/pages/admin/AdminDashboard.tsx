import { useState, useEffect } from 'react';
import { Users, LayoutGrid, Eye, Activity, ArrowUp, ArrowDown, Clock } from 'lucide-react';
import { api } from '../../lib/api';
import CustomSelect from '../../components/CustomSelect';

const AdminDashboard = () => {


    // Real-time stats
    const [stats, setStats] = useState({
        onlineUsers: 0,
        totalProjects: 0,
        totalViews: 0,
        serverStatus: 'Checking...',
        uptime: '---',
        trafficData: [] as any[],
        activities: [] as any[]
    });
    const [timeRange, setTimeRange] = useState('7d');

    const maxVisits = Math.max(...(stats.trafficData.length > 0 ? stats.trafficData.map((d: any) => d.visits) : [100]));

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Use the admin token we stored
                const token = localStorage.getItem('adminToken');
                if (token) {
                    const data = await api.getAdminDashboardStats(token);
                    setStats({
                        onlineUsers: data.onlineUsers,
                        totalProjects: data.totalProjects,
                        totalViews: data.totalViews,
                        serverStatus: data.serverStatus,
                        uptime: data.uptime,
                        trafficData: data.trafficData || [],
                        activities: data.activities || []
                    });
                }
            } catch (err) {
                console.error("Failed to fetch admin stats", err);
            }
        };

        fetchStats(); // Initial fetch

        // Poll every 60 seconds (no need for 3s jitter for real data)
        const interval = setInterval(fetchStats, 60000);

        return () => clearInterval(interval);
    }, []);



    // Helper for relative time
    const timeAgo = (date: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " ปีที่แล้ว";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " เดือนที่แล้ว";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " วันที่แล้ว";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " ชั่วโมงที่แล้ว";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " นาทีที่แล้ว";
        return Math.floor(seconds) + " วินาทีที่แล้ว";
    };

    return (
        <div className="space-y-8 animate-fade-in">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                        ศูนย์ควบคุมผู้ดูแลระบบ
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        ระบบทำงานปกติ • {new Date().toLocaleString('th-TH')}
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="ผู้ใช้ออนไลน์"
                    value={stats.onlineUsers}
                    icon={Users}
                    color="text-blue-500"
                    trend="+12%" // We could calculate this if we had history
                    trendUp={true}
                />
                <StatCard
                    title="โครงการทั้งหมด"
                    value={stats.totalProjects}
                    icon={LayoutGrid}
                    color="text-purple-500"
                    subtext="จากทุกสาขาวิชา"
                />
                <StatCard
                    title="ยอดเข้าชมรวม"
                    value={stats.totalViews.toLocaleString()}
                    icon={Eye}
                    color="text-green-500"
                    trend="+5.3%"
                    trendUp={true}
                />
                <StatCard
                    title="สถานะเซิร์ฟเวอร์"
                    value={stats.serverStatus}
                    icon={Activity}
                    color="text-emerald-500"
                    subtext={`Uptime: ${stats.uptime}`}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Traffic Chart */}
                <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <Activity className="w-5 h-5 text-red-500" /> ภาพรวมการเข้าชม
                        </h3>
                        <CustomSelect
                            value={timeRange}
                            onChange={setTimeRange}
                            options={[{ value: '7d', label: '7 วันล่าสุด' }]}
                        />
                    </div>

                    {/* Custom SVG Bar Chart */}
                    <div className="h-64 w-full flex items-end justify-between gap-2 px-2">
                        {stats.trafficData.length === 0 ? (
                            <div className="w-full h-full flex items-center justify-center text-zinc-600">ไม่มีข้อมูลการเข้าชม</div>
                        ) : (
                            stats.trafficData.map((data: any, i: number) => {
                                const height = (data.visits / maxVisits) * 100;
                                return (
                                    <div key={i} className="flex flex-col items-center gap-2 w-full group">
                                        <div className="relative w-full flex justify-center">
                                            {/* Tooltip */}
                                            <div className="absolute -top-8 bg-zinc-800 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-zinc-700 pointer-events-none">
                                                {data.visits} ครั้ง
                                            </div>
                                            {/* Bar */}
                                            <div
                                                className="w-full max-w-[40px] bg-gradient-to-t from-red-900/50 to-red-500/50 rounded-t-sm hover:from-red-800 hover:to-red-400 transition-all duration-300 relative group-hover:shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                                                style={{ height: `${Math.max(height, 5)}%` }}
                                            />
                                        </div>
                                        <span className="text-xs text-zinc-500 font-mono">{data.day}</span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="lg:col-span-1 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                    <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
                        <Clock className="w-5 h-5 text-blue-500" /> กิจกรรมล่าสุด
                    </h3>
                    <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-2 before:w-px before:bg-zinc-800">
                        {stats.activities.length === 0 ? (
                            <p className="text-zinc-500 text-sm pl-8">ไม่มีกิจกรรมล่าสุด.</p>
                        ) : (
                            stats.activities.map((act: any, i: number) => (
                                <ActivityItem
                                    key={i}
                                    time={timeAgo(act.time)}
                                    title={act.title}
                                    desc={act.desc}
                                    color={act.color}
                                />
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon: Icon, color, trend, trendUp, subtext }: any) => (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 transition-colors">
        <div className="flex justify-between items-start mb-4">
            <div>
                <p className="text-zinc-500 text-sm font-medium">{title}</p>
                <h3 className="text-3xl font-bold mt-1 text-white transition-transform origin-left">{value}</h3>
            </div>
            <div className={`p-3 rounded-lg bg-zinc-950 border border-zinc-800 transition-colors ${color}`}>
                <Icon className="w-6 h-6" />
            </div>
        </div>
        <div className="flex items-center text-xs">
            {trend && (
                <span className={`flex items-center gap-1 font-medium ${trendUp ? 'text-green-500' : 'text-red-500'} bg-black/30 px-2 py-1 rounded-full`}>
                    {trendUp ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                    {trend}
                </span>
            )}
            {subtext && <span className="text-zinc-500 ml-auto">{subtext}</span>}
        </div>
    </div>
);

const ActivityItem = ({ time, title, desc, color }: any) => (
    <div className="relative pl-8">
        <div className={`absolute left-[0.2rem] top-1.5 w-3 h-3 rounded-full border-2 border-black ${color}`} />
        <p className="text-xs text-zinc-500 font-mono mb-1">{time}</p>
        <p className="text-sm font-bold text-zinc-200">{title}</p>
        <p className="text-xs text-zinc-400 mt-0.5">{desc}</p>
    </div>
);

export default AdminDashboard;
