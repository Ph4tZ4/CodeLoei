import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { PieChart, Eye, Star, Layers, Lock, Globe, Hash, BarChart3, Sparkles, Flame, Crown } from 'lucide-react';
import { useAlert } from '../../contexts/AlertContext';

const AdminProjectOverview = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { alert } = useAlert();

    // AI States
    const [showAIModal, setShowAIModal] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [aiData, setAiData] = useState<{ summary: string; trends: string } | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const token = localStorage.getItem('adminToken');
                if (token) {
                    const data = await api.getProjectStats(token);
                    setStats(data);
                }
            } catch (err) {
                console.error("Failed to fetch project stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const handleAnalyze = async () => {
        setAnalyzing(true);
        setShowAIModal(true);
        try {
            const token = localStorage.getItem('adminToken') || '';
            const res = await api.post('/ai/analyze-overview', {}, token);
            setAiData(res as any);
        } catch (err) {
            console.error(err);
            alert('AI Analysis failed');
            setShowAIModal(false);
        } finally {
            setAnalyzing(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-zinc-400">Loading statistics...</div>;

    if (!stats) return <div className="p-8 text-center text-zinc-400">Failed to load data.</div>;

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
                        <BarChart3 className="w-6 h-6 text-white" />
                        ภาพรวมโครงการ
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1">
                        ข้อมูลสถิติเชิงลึกของโครงการทั้งหมดในระบบ
                    </p>
                </div>
                <button
                    onClick={handleAnalyze}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg transition-all font-medium shadow-lg shadow-purple-900/20"
                >
                    <Sparkles className="w-4 h-4" />
                    Analyze with AI
                </button>
            </div>

            {/* AI Modal */}
            {
                showAIModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative">
                            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-purple-400" />
                                    AI Ecosystem Insights
                                </h3>
                                <button
                                    onClick={() => setShowAIModal(false)}
                                    className="text-zinc-400 hover:text-white transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="p-6 max-h-[70vh] overflow-y-auto">
                                {analyzing ? (
                                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                                        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                        <p className="text-zinc-400 animate-pulse">Analyzing ecosystem data to generate insights...</p>
                                    </div>
                                ) : aiData ? (
                                    <div className="space-y-6">
                                        <div className="bg-purple-900/20 border border-purple-500/20 rounded-xl p-5">
                                            <h4 className="text-purple-300 font-semibold mb-2 text-lg">Executive Summary</h4>
                                            <p className="text-zinc-300 leading-relaxed">{aiData.summary}</p>
                                        </div>

                                        <div className="bg-blue-900/20 border border-blue-500/20 rounded-xl p-5">
                                            <h4 className="text-blue-300 font-semibold mb-2 text-lg">Key Trends & Patterns</h4>
                                            <div className="text-zinc-300 leading-relaxed whitespace-pre-line">{aiData.trends}</div>
                                        </div>

                                        <div className="text-xs text-zinc-500 text-center pt-4">
                                            Powered by Google Gemini AI • Analysis based on aggregate system metrics
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center text-red-400 py-8">
                                        Failed to load analysis. Please try again.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    title="จำนวนโครงการทั้งหมด"
                    value={stats.totalProjects}
                    icon={Layers}
                    color="text-blue-500"
                    bg="bg-blue-500/10"
                />
                <StatCard
                    title="โครงการสาธารณะ (Public)"
                    value={stats.visibilityDistribution.find((v: any) => v.name === 'public')?.value || 0}
                    icon={Globe}
                    color="text-emerald-500"
                    bg="bg-emerald-500/10"
                />
                <StatCard
                    title="โครงการส่วนตัว (Private)"
                    value={stats.visibilityDistribution.find((v: any) => v.name === 'private')?.value || 0}
                    icon={Lock}
                    color="text-amber-500"
                    bg="bg-amber-500/10"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Language Distribution */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                    <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
                        <PieChart className="w-5 h-5 text-purple-500" /> สัดส่วนภาษาที่ใช้
                    </h3>
                    <div className="space-y-4">
                        {stats.languageDistribution.map((lang: any, index: number) => (
                            <div key={index}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-zinc-300 font-medium">{lang.name || 'ไม่ระบุ'}</span>
                                    <span className="text-zinc-500">{lang.value} โครงการ ({Math.round((lang.value / stats.totalProjects) * 100)}%)</span>
                                </div>
                                <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className="bg-purple-500 h-2.5 rounded-full"
                                        style={{ width: `${(lang.value / stats.totalProjects) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Popular Tags */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                    <h3 className="text-lg font-bold flex items-center gap-2 mb-6">
                        <Hash className="w-5 h-5 text-pink-500" /> แท็กยอดนิยม
                    </h3>
                    <div className="space-y-4">
                        {stats.popularTags?.map((tag: any, index: number) => (
                            <div key={index}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-zinc-300 font-medium">#{tag.name}</span>
                                    <span className="text-zinc-500">{tag.value} โครงการ</span>
                                </div>
                                <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className="bg-pink-500 h-2.5 rounded-full"
                                        style={{ width: `${(tag.value / stats.totalProjects) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                        {(!stats.popularTags || stats.popularTags.length === 0) && (
                            <div className="text-center text-zinc-500 py-4">ไม่มีข้อมูลแท็ก</div>
                        )}
                    </div>
                </div>

                {/* Top Projects Lists */}
                {/* Top Projects Lists (Flattened for Grid) */}
                {/* Most Viewed */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                    <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                        <Eye className="w-5 h-5 text-blue-500" /> โครงการที่มีผู้เข้าชมสูงสุด
                    </h3>
                    <div className="space-y-3">
                        {stats.topViewed.map((project: any, i: number) => (
                            <ProjectRankItem
                                key={project._id}
                                rank={i + 1}
                                project={project}
                                metric={project.views}
                                metricLabel="Views"
                                icon={Eye}
                                color="text-blue-500"
                            />
                        ))}
                    </div>
                </div>

                {/* Most Starred */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                    <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                        <Star className="w-5 h-5 text-yellow-500" /> โครงการยอดนิยม (Stars)
                    </h3>
                    <div className="space-y-3">
                        {stats.topStarred.map((project: any, i: number) => (
                            <ProjectRankItem
                                key={project._id}
                                rank={i + 1}
                                project={project}
                                metric={project.stars}
                                metricLabel="Stars"
                                icon={Star}
                                color="text-yellow-500"
                            />
                        ))}
                    </div>
                </div>

                {/* Top Popular (Score) */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                    <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                        <Flame className="w-5 h-5 text-orange-500" /> ยอดนิยมสูงสุด (Score)
                    </h3>
                    <div className="space-y-3">
                        {stats.topPopular?.map((project: any, i: number) => (
                            <ProjectRankItem
                                key={project._id}
                                rank={i + 1}
                                project={project}
                                metric={project.score}
                                metricLabel="Score"
                                icon={Flame}
                                color="text-orange-500"
                            />
                        ))}
                    </div>
                </div>

                {/* Top Popular Users (Score) */}
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
                    <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                        <Crown className="w-5 h-5 text-purple-500" /> ผู้ใช้ยอดนิยม (Score)
                    </h3>
                    <div className="space-y-3">
                        {stats.topPopularUsers?.map((user: any, i: number) => (
                            <div key={user._id} className="flex items-center justify-between p-3 rounded-lg bg-black/20 hover:bg-black/40 transition-colors" title={`Score: ${user.score} (Views: ${user.stats.views}, Stars: ${user.stats.stars}, DL: ${user.stats.downloads}, Followers: ${user.stats.followers})`}>
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <span className={`w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full text-xs font-bold ${i === 0 ? 'bg-purple-500/20 text-purple-500' : 'bg-zinc-800 text-zinc-500'}`}>
                                        {i + 1}
                                    </span>
                                    <div className="overflow-hidden">
                                        <p className="text-sm font-bold text-zinc-200 truncate">{user.displayName}</p>
                                        <p className="text-xs text-zinc-500 truncate">Score: {user.score}</p>
                                    </div>
                                </div>
                                <div className={`flex items-center gap-1.5 text-xs font-bold text-purple-500`}>
                                    <span>{user.score}</span>
                                    <Crown className="w-3 h-3" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div >
        </div >
    );
};

const StatCard = ({ title, value, icon: Icon, color, bg }: any) => (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 flex items-center justify-between">
        <div>
            <p className="text-zinc-500 text-sm font-medium">{title}</p>
            <h3 className="text-3xl font-bold mt-1 text-white">{value}</h3>
        </div>
        <div className={`p-3 rounded-lg ${bg} ${color}`}>
            <Icon className="w-6 h-6" />
        </div>
    </div>
);

const ProjectRankItem = ({ rank, project, metric, metricLabel, icon: Icon, color }: any) => (
    <div className="flex items-center justify-between p-3 rounded-lg bg-black/20 hover:bg-black/40 transition-colors" title={`${metricLabel}: ${metric}`}>
        <div className="flex items-center gap-3 overflow-hidden">
            <span className={`w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-full text-xs font-bold ${rank === 1 ? 'bg-yellow-500/20 text-yellow-500' : 'bg-zinc-800 text-zinc-500'}`}>
                {rank}
            </span>
            <div className="overflow-hidden">
                <p className="text-sm font-bold text-zinc-200 truncate">{project.name}</p>
                <p className="text-xs text-zinc-500 truncate">by {project.ownerId?.displayName || 'Unknown'}</p>
            </div>
        </div>
        <div className={`flex items-center gap-1.5 text-xs font-bold ${color}`}>
            <span>{metric}</span>
            <Icon className="w-3 h-3" />
        </div>
    </div>
);

export default AdminProjectOverview;
