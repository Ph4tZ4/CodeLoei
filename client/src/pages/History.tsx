import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Clock, ExternalLink, Star } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const History = () => {
    const { t, language } = useLanguage();
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchHistory = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const data = await api.getBrowsingHistory(token);
                    setHistory(data);
                } catch (err) {
                    console.error('Failed to fetch history:', err);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    if (loading) {
        return <div className="text-white text-center mt-10">Loading history...</div>;
    }

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">{t('history.title')}</h1>
                    <p className="text-zinc-400 text-sm">{t('history.subtitle')}</p>
                </div>
            </div>

            {history.length === 0 ? (
                <div className="text-center text-zinc-500 py-20 bg-zinc-900/20 rounded-xl border border-dashed border-zinc-800">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>{t('history.no_history')}</p>
                </div>
            ) : (
                <div className="flex flex-col space-y-3">
                    {history.map((item) => {
                        if (!item.project) return null;
                        return (
                            <div key={item._id}
                                onClick={() => navigate(`/projects/${item.project._id}`)}
                                className="group flex flex-col md:flex-row items-start md:items-center gap-4 bg-zinc-900/40 border border-zinc-800 hover:border-blue-500/50 rounded-xl p-4 cursor-pointer transition-all hover:bg-zinc-900/60"
                            >
                                <div className="flex items-center gap-4 flex-1 min-w-0 w-full">
                                    <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors shrink-0">
                                        <ExternalLink className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors truncate">
                                            {item.project.name}
                                        </h3>
                                        <p className="text-zinc-400 text-sm truncate">
                                            {item.project.description || 'No description'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 text-xs text-zinc-500 shrink-0 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-zinc-800/50 pt-3 md:pt-0">
                                    <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-text-muted">
                                        {item.project.language || 'Unknown'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Star className="w-3 h-3" /> {item.project.stars || 0}
                                    </span>
                                    <span className="text-zinc-600 font-mono hidden md:inline-block">
                                        |
                                    </span>
                                    <span className="text-zinc-400 font-medium">
                                        {typeof item.project.ownerId !== 'string' ? item.project.ownerId.displayName : 'Unknown'}
                                    </span>
                                    <span className="text-zinc-600 font-mono hidden md:inline-block">
                                        |
                                    </span>
                                    <span className="text-zinc-500 font-mono">
                                        {new Date(item.viewedAt).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', {
                                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default History;
