import { useState, useEffect } from 'react';
import { LayoutDashboard, Download, Eye, Star, User, ArrowUpRight, BarChart2, Award, Activity, Loader2, ChevronDown } from 'lucide-react';
import type { Project } from '../types';
import { api } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';

const Dashboard = () => {
    const { t } = useLanguage();
    const [filterOpen, setFilterOpen] = useState(false);
    const [selectedFilterKey, setSelectedFilterKey] = useState<string>('7d');
    const [stats, setStats] = useState<any>({
        totalViews: 0,
        totalStars: 0,
        totalDownloads: 0,
        profileVisits: 0,
        viewsGrowth: "+0%",
        starsGrowth: "+0%",
        downloadsGrowth: "+0%",
        visitsGrowth: "+0%"
    });
    const [loading, setLoading] = useState(true);

    const filterOptions = [
        { key: '7d', label: t('dashboard.range.7d') },
        { key: '30d', label: t('dashboard.range.30d') },
        { key: '1y', label: t('dashboard.range.1y') },
    ];

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    const data = await api.getDashboardStats(token, selectedFilterKey);
                    setStats(data);
                }
            } catch (err) {
                console.error("Failed to fetch dashboard stats", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [selectedFilterKey]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }


    // Helper for relative time
    const timeAgo = (date: string) => {
        const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) {
            const val = Math.floor(interval);
            return `${val} ${val > 1 ? t('time.years') : t('time.year')} ${t('time.ago')}`;
        }
        interval = seconds / 2592000;
        if (interval > 1) {
            const val = Math.floor(interval);
            return `${val} ${val > 1 ? t('time.months') : t('time.month')} ${t('time.ago')}`;
        }
        interval = seconds / 86400;
        if (interval > 1) {
            const val = Math.floor(interval);
            return `${val} ${val > 1 ? t('time.days') : t('time.day')} ${t('time.ago')}`;
        }
        interval = seconds / 3600;
        if (interval > 1) {
            const val = Math.floor(interval);
            return `${val} ${val > 1 ? t('time.hours') : t('time.hour')} ${t('time.ago')}`;
        }
        interval = seconds / 60;
        if (interval > 1) {
            const val = Math.floor(interval);
            return `${val} ${val > 1 ? t('time.minutes') : t('time.minute')} ${t('time.ago')}`;
        }
        const val = Math.floor(seconds);
        return `${val} ${val > 1 ? t('time.seconds') : t('time.second')} ${t('time.ago')}`;
    };

    const getSelectedLabel = () => {
        return filterOptions.find(o => o.key === selectedFilterKey)?.label || filterOptions[0].label;
    };

    return (
        <div className="animate-fade-in space-y-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <LayoutDashboard className="w-6 h-6 text-white" /> {t('dashboard.title')}
                    </h2>
                    <p className="text-gray-500 text-sm">{t('dashboard.subtitle')}</p>
                </div>
                <div className="flex items-center gap-3 relative">
                    <div className="relative">
                        <button
                            onClick={() => setFilterOpen(!filterOpen)}
                            className="bg-zinc-900 border border-zinc-700 text-gray-300 text-sm rounded-lg px-4 py-2 outline-none flex items-center gap-2 hover:bg-zinc-800 transition-all active:scale-95"
                        >
                            <span className="text-text-muted">{t('dashboard.range.label')}</span>
                            <span className="text-white">{getSelectedLabel()}</span>
                            <ChevronDown className={`w-4 h-4 transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {filterOpen && (
                            <div className="absolute top-full right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                                {filterOptions.map((option) => (
                                    <button
                                        key={option.key}
                                        onClick={() => {
                                            setSelectedFilterKey(option.key);
                                            setFilterOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-3 text-sm hover:bg-zinc-800 transition-colors flex items-center justify-between ${selectedFilterKey === option.key ? 'text-blue-400 bg-blue-500/10' : 'text-text-muted'
                                            }`}
                                    >
                                        {option.label}
                                        {selectedFilterKey === option.key && <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    {/* Backdrop to close */}
                    {filterOpen && (
                        <div className="fixed inset-0 z-40" onClick={() => setFilterOpen(false)} />
                    )}


                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-xl">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><Eye className="w-5 h-5" /></div>
                        <span className="text-green-400 text-xs font-medium flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded-full">{stats.viewsGrowth || "+0%"} <ArrowUpRight className="w-3 h-3" /></span>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{(stats.totalViews || 0).toLocaleString()}</div>
                    <div className="text-xs text-zinc-500">{t('dashboard.card.views')}</div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-xl">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-400"><Star className="w-5 h-5" /></div>
                        <span className="text-green-400 text-xs font-medium flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded-full">{stats.starsGrowth || "+0%"} <ArrowUpRight className="w-3 h-3" /></span>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{stats.totalStars || 0}</div>
                    <div className="text-xs text-zinc-500">{t('dashboard.card.stars')}</div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-xl">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><Download className="w-5 h-5" /></div>
                        <span className="text-green-400 text-xs font-medium flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded-full">{stats.downloadsGrowth || "+0%"} <ArrowUpRight className="w-3 h-3" /></span>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{(stats.totalDownloads || 0).toLocaleString()}</div>
                    <div className="text-xs text-zinc-500">{t('dashboard.card.downloads')}</div>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-xl">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-green-500/10 rounded-lg text-green-400"><User className="w-5 h-5" /></div>
                        <span className="text-green-400 text-xs font-medium flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded-full">{stats.visitsGrowth || "+0%"} <ArrowUpRight className="w-3 h-3" /></span>
                    </div>
                    <div className="text-3xl font-bold text-white mb-1">{(stats.profileVisits || 0).toLocaleString()}</div>
                    <div className="text-xs text-zinc-500">{t('dashboard.card.visits')}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Charts & Tables */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Traffic Graph */}
                    <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6 overflow-x-auto">
                        <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                            <BarChart2 className="w-5 h-5 text-gray-400" /> {t('dashboard.chart.title')} ({getSelectedLabel()})
                        </h3>
                        {/* Container with min-width to ensure scroll on small screens if many bars */}
                        <div className="min-w-[300px]">
                            <div className="h-64 w-full flex items-end justify-between gap-1 px-2">
                                {(stats.chartData || [0, 0, 0, 0, 0, 0, 0]).map((count: number, i: number) => {
                                    // Scale bar height relative to max value (max height 100%)
                                    const max = Math.max(...(stats.chartData || [1]), 1);
                                    const heightPercentage = Math.min((count / max) * 100, 100);
                                    return (
                                        <div key={i} className="w-full bg-zinc-800 rounded-t-sm relative group hover:bg-blue-500/20 transition-colors"
                                            style={{ height: `${heightPercentage === 0 ? 5 : heightPercentage}%` }}>
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                                                {count}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex justify-between mt-2 text-xs text-zinc-500 px-2 gap-1 overflow-visible">
                                {(stats.labels || []).map((label: string, i: number) => {
                                    // Logic to hide some labels if too many (e.g. 30 days)
                                    // Show every 3rd label if range is 30d (length > 10)
                                    const shouldShow = (stats.labels?.length || 0) <= 12 || i % 5 === 0 || i === (stats.labels?.length || 0) - 1;
                                    return (
                                        <span key={i} className={`flex-1 text-center whitespace-nowrap ${shouldShow ? 'opacity-100' : 'opacity-0'}`}>
                                            {label}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Top Projects Table */}
                    <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl overflow-hidden">
                        <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Award className="w-5 h-5 text-gray-400" /> {t('dashboard.top_projects.title')}
                            </h3>
                            <button className="text-xs text-blue-400 hover:text-blue-300">{t('dashboard.top_projects.view_all')}</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-zinc-500 uppercase bg-zinc-900/50">
                                    <tr>
                                        <th className="px-6 py-3">{t('dashboard.table.name')}</th>
                                        <th className="px-6 py-3">{t('dashboard.table.views')}</th>
                                        <th className="px-6 py-3">{t('dashboard.table.downloads')}</th>
                                        <th className="px-6 py-3">{t('dashboard.table.stars')}</th>
                                        <th className="px-6 py-3">{t('dashboard.table.status')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(stats.topProjects || []).length > 0 ? (
                                        (stats.topProjects || []).map((proj: Project, idx: number) => (
                                            <tr key={idx} className="border-b border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                                                <td className="px-6 py-4 font-medium text-white">{proj.name}</td>
                                                <td className="px-6 py-4 text-zinc-400">{proj.views || 0}</td>
                                                <td className="px-6 py-4 text-zinc-400">{proj.downloadCount || 0}</td>
                                                <td className="px-6 py-4 text-yellow-500 flex items-center gap-1"><Star className="w-3 h-3" /> {proj.stars}</td>
                                                <td className="px-6 py-4">
                                                    <span className="bg-green-500/10 text-green-400 px-2 py-1 rounded-full text-xs">{t('dashboard.table.active')}</span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                                                {t('dashboard.table.no_data')}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right: Activity Log */}
                <div className="lg:col-span-1">
                    <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6 h-full">
                        <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-gray-400" /> {t('dashboard.activity.title')}
                        </h3>
                        <div className="space-y-6 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-800">
                            {(stats.activities || []).length > 0 ? (stats.activities.map((activity: any, i: number) => (
                                <div key={i} className="relative pl-8">
                                    <div className={`absolute left-0 top-1 w-4 h-4 rounded-full border-2 border-black ${activity.type === 'star' ? 'bg-yellow-500' :
                                        activity.type === 'download' ? 'bg-blue-500' :
                                            activity.type === 'create' ? 'bg-emerald-500' :
                                                activity.type === 'update' ? 'bg-green-500' :
                                                    activity.type === 'view' ? 'bg-purple-500' : 'bg-zinc-500'
                                        }`}></div>
                                    <p className="text-xs text-zinc-500 font-mono mb-1">{timeAgo(activity.time)}</p>
                                    <p className="text-sm font-medium text-text-muted">{activity.text}</p>
                                </div>
                            ))) : (
                                <p className="text-zinc-500 pl-8">{t('dashboard.activity.no_data')}</p>
                            )}
                        </div>
                        <button className="w-full mt-6 py-2 text-xs text-zinc-500 hover:text-white hover:bg-zinc-800 rounded transition-colors">
                            {t('dashboard.activity.view_all')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default Dashboard;
