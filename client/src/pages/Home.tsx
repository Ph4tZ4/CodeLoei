import { TrendingUp, Folder } from 'lucide-react';
import ProjectCard from '../components/ProjectCard';
import type { Project } from '../types';
import { useNavigate } from 'react-router-dom';

import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';

const Home = ({ projects: allProjects }: { projects: Project[] }) => {
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const [popularProjects, setPopularProjects] = useState<Project[]>([]);
    const [news, setNews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [popularData, newsData] = await Promise.all([
                    api.getPopularProjects(),
                    api.getNews()
                ]);
                setPopularProjects(popularData);
                setNews(newsData);
            } catch (err) {
                console.error("Failed to fetch data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [allProjects]);

    return (
        <div className="animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-white" /> {t('home.popular_title')}
                    </h2>
                    <p className="text-gray-500 text-sm">
                        {t('home.popular_desc')}
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 animate-pulse text-zinc-500">{t('home.loading_popular')}</div>
            ) : popularProjects.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-zinc-800 rounded-lg bg-zinc-900/20 animate-fade-in">
                    <Folder className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                    <h3 className="text-zinc-400 font-medium">{t('home.no_popular')}</h3>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {popularProjects.slice(0, 4).map((project, idx) => (
                        <ProjectCard
                            key={project._id}
                            project={project}
                            index={idx}
                            onClick={() => navigate(`/projects/${project._id}`)}
                        />
                    ))}
                </div>
            )}

            {/* News Section */}
            <div className="mt-12">
                <h2 className="text-2xl font-bold flex items-center gap-2 mb-6">
                    <TrendingUp className="w-6 h-6 text-white" /> {t('home.news_title')}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Show first 6 news items */}
                    {news.slice(0, 6).map((item) => (
                        <div
                            key={item._id}
                            onClick={() => navigate(`/news/${item._id}`)}
                            className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 hover:border-blue-500/50 transition-all cursor-pointer group"
                        >
                            <span className={`text-xs font-mono font-bold mb-2 block ${item.categoryColor}`}>
                                {new Date(item.createdAt).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                                {item.title}
                            </h3>
                            <p className="text-zinc-400 text-sm line-clamp-3">
                                {item.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
export default Home;
