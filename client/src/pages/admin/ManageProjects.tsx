import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import type { Project } from '../../types';
import { Trash2, ExternalLink, Search, Filter, Settings, Star, Download, Code, Sparkles, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import CustomSelect from '../../components/CustomSelect';
import { useAlert } from '../../contexts/AlertContext';

export default function ManageProjects() {
    const { alert, confirm } = useAlert();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<'all' | 'public' | 'private'>('all');
    const [langFilter, setLangFilter] = useState('All');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // AI States
    const [showAIModal, setShowAIModal] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [aiData, setAiData] = useState<{ summary: string; trends: string } | null>(null);

    useEffect(() => {
        fetchProjects();
    }, []);

    // ... fetchProjects ...
    const fetchProjects = async () => {
        try {
            const token = localStorage.getItem('adminToken');
            const data = await api.get('/projects?limit=1000', token || undefined);
            setProjects(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyze = async () => {
        setAnalyzing(true);
        setShowAIModal(true);
        try {
            const token = localStorage.getItem('adminToken') || '';
            const res = await api.post('/ai/analyze', {}, token);
            setAiData(res as any);
        } catch (err) {
            console.error(err);
            alert('AI Analysis failed');
            setShowAIModal(false);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleDelete = async (id: string) => {
        // ... (existing)
        if (!await confirm('คุณแน่ใจหรือไม่ว่าต้องการลบโครงการนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้', undefined, 'danger')) return;
        try {
            const token = localStorage.getItem('adminToken') || '';
            await api.delete(`/projects/${id}`, token);
            setProjects(projects.filter(p => p._id !== id));
        } catch (err) {
            console.error(err);
            await alert('Failed to delete project', undefined, 'danger');
        }
    };

    const filteredProjects = projects.filter(p => {
        const ownerName = typeof p.ownerId === 'object' ? (p.ownerId as any).displayName : '';
        const searchLower = searchTerm.toLowerCase();

        const matchesSearch =
            p.name.toLowerCase().includes(searchLower) ||
            p.description?.toLowerCase().includes(searchLower) ||
            ownerName.toLowerCase().includes(searchLower);

        // Visibility Filter
        const matchesFilter = filter === 'all' || p.visibility === filter;

        // Language Filter
        const matchesLang = langFilter === 'All' || p.language === langFilter;

        // Date Filter
        let matchesDate = true;
        if (dateFrom) {
            matchesDate = matchesDate && new Date(p.createdAt) >= new Date(dateFrom);
        }
        if (dateTo) {
            // Add 1 day to include the end date fully
            const endDate = new Date(dateTo);
            endDate.setDate(endDate.getDate() + 1);
            matchesDate = matchesDate && new Date(p.createdAt) < endDate;
        }

        return matchesSearch && matchesFilter && matchesLang && matchesDate;
    });

    if (loading) return <div className="p-8 text-center text-zinc-400">Loading projects...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Settings className="w-6 h-6" /> จัดการโครงการ
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        จัดการและตรวจสอบโครงการทั้งหมดของนักศึกษา
                    </p>
                </div>
                {/* AI Analyze Button */}
                <button
                    onClick={handleAnalyze}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg transition-all font-medium shadow-lg shadow-purple-900/20"
                >
                    <Sparkles className="w-4 h-4" />
                    Analyze with AI
                </button>
            </div>
            {/* AI Modal */}

            {/* AI Modal */}
            {
                showAIModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative">
                            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/50">
                                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-purple-400" />
                                    AI Project Insights
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
                                        <p className="text-zinc-400 animate-pulse">Analyzing project data to generate insights...</p>
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
                                            Powered by Google Gemini AI • Analysis based on recent project data
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

            {/* Filters */}
            <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800 space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="ค้นหาโครงการ, รายละเอียด หรือ ชื่อเจ้าของ..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-zinc-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
                        />
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <Filter className="w-4 h-4 text-zinc-400" />
                        <CustomSelect
                            value={filter}
                            onChange={(val) => setFilter(val as 'all' | 'public' | 'private')}
                            options={[
                                { value: "all", label: "การมองเห็นทั้งหมด" },
                                { value: "public", label: "สาธารณะ" },
                                { value: "private", label: "ส่วนตัว" }
                            ]}
                            className="min-w-[150px]"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <Code className="w-4 h-4 text-zinc-400" />
                        <CustomSelect
                            value={langFilter}
                            onChange={(val) => setLangFilter(val)}
                            options={[
                                { value: "All", label: "ทุกภาษา" },
                                { value: "TypeScript", label: "TypeScript" },
                                { value: "JavaScript", label: "JavaScript" },
                                { value: "Python", label: "Python" },
                                { value: "Java", label: "Java" },
                                { value: "C#", label: "C#" },
                                { value: "Go", label: "Go" },
                                { value: "Rust", label: "Rust" }
                            ]}
                            className="min-w-[150px]"
                        />
                    </div>

                    <div className="flex items-center gap-2 ml-auto">
                        <span className="text-zinc-500 text-sm">จาก:</span>
                        <input
                            type="date"
                            className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-zinc-300 text-sm outline-none focus:border-blue-500"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                        />
                        <span className="text-zinc-500 text-sm">ถึง:</span>
                        <input
                            type="date"
                            className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1.5 text-zinc-300 text-sm outline-none focus:border-blue-500"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-zinc-400">
                        <thead className="bg-zinc-900/80 text-zinc-200 uppercase tracking-wider text-xs border-b border-zinc-800">
                            <tr>
                                <th className="px-6 py-4 font-semibold">ชื่อโครงการ</th>
                                <th className="px-6 py-4 font-semibold">เจ้าของ</th>
                                <th className="px-6 py-4 font-semibold">ภาษา</th>
                                <th className="px-6 py-4 font-semibold">สถิติ</th>
                                <th className="px-6 py-4 font-semibold">สถานะ</th>
                                <th className="px-6 py-4 font-semibold text-right">การจัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {filteredProjects.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                                        No projects found.
                                    </td>
                                </tr>
                            ) : (
                                filteredProjects.map((project) => (
                                    <tr key={project._id} className="hover:bg-zinc-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-zinc-200">{project.name}</div>
                                            <div className="text-xs text-zinc-500 truncate max-w-[200px]">{project.description}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {project.ownerId && typeof project.ownerId === 'object' ? (
                                                    <>
                                                        <img src={(project.ownerId as any).photoURL || 'https://via.placeholder.com/30'} alt="" className="w-6 h-6 rounded-full" />
                                                        <span className="text-zinc-300">{(project.ownerId as any).displayName}</span>
                                                    </>
                                                ) : (
                                                    <span className="text-zinc-500">Unknown</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 text-xs border border-blue-500/20">
                                                {project.language}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1 text-xs">
                                                <span className="flex items-center gap-1 text-zinc-400">
                                                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500/20" />
                                                    {project.stars || 0}
                                                </span>
                                                <span className="flex items-center gap-1 text-zinc-400">
                                                    <Download className="w-3 h-3 text-blue-400" />
                                                    {project.downloadCount || 0}
                                                </span>
                                                <span className="flex items-center gap-1 text-zinc-400">
                                                    <Eye className="w-3 h-3 text-green-400" />
                                                    {project.views || 0}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {project.visibility === 'public' ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                                                    Public
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                                                    Private
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link to={`/admin/projects/${project._id}`} className="p-2 hover:bg-zinc-700/50 rounded-lg text-zinc-400 hover:text-blue-400 transition-colors">
                                                    <ExternalLink className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(project._id)}
                                                    className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-400 hover:text-red-400 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
}
