import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { ArrowLeft, Calendar, Share2, Clock, AppWindow } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

const NewsDetail = () => {
    const { t, language } = useLanguage();
    const { theme } = useTheme();
    const { id } = useParams();
    const navigate = useNavigate();
    const [news, setNews] = useState<any>(null);
    const [otherNews, setOtherNews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch current news and all news (for sidebar)
                // In a real app, you might have a dedicated "related news" endpoint
                const [newsData, allNews] = await Promise.all([
                    api.getNewsById(id!),
                    api.getNews()
                ]);

                setNews(newsData);

                // Filter out current news and shuffle/slice for sidebar
                const others = allNews
                    .filter((n: any) => n._id !== id)
                    .sort(() => 0.5 - Math.random())
                    .slice(0, 5);
                setOtherNews(others);

            } catch (err) {
                console.error("Failed to fetch news detail", err);
                setNews(null);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchData();
            window.scrollTo(0, 0);
        }
    }, [id]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh] text-zinc-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mr-2"></div>
                {t('news.loading')}
            </div>
        );
    }

    if (!news) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-zinc-500">
                <AppWindow className="w-12 h-12 mb-4 opacity-50" />
                <p>{t('news.not_found')}</p>
                <button
                    onClick={() => navigate('/')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    {t('news.back_home')}
                </button>
            </div>
        );
    }

    return (
        <div className="animate-fade-in max-w-6xl mx-auto">
            <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors mb-6 group"
            >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                {t('news.back')}
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 md:p-8 shadow-sm dark:shadow-none">
                        {/* Header */}
                        <div className="mb-6">
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold bg-zinc-100 dark:bg-zinc-800 mb-4 ${news.categoryColor}`}>
                                {news.category}
                            </span>
                            <h1 className="text-2xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-4 leading-tight">
                                {news.title}
                            </h1>
                            <div className="flex items-center gap-4 text-zinc-500 dark:text-zinc-400 text-sm">
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(news.createdAt).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    3 {t('news.read_time')}
                                </span>
                            </div>
                        </div>

                        <div className="h-px bg-zinc-800/50 my-6" />

                        {/* Content */}
                        <div
                            className={`prose dark:prose-invert max-w-none 
                            text-zinc-900 dark:text-zinc-100 
                            [&>*]:text-zinc-900 dark:[&>*]:text-zinc-100
                            [&_p]:text-zinc-900 dark:[&_p]:text-zinc-100
                            [&_h1]:text-zinc-900 dark:[&_h1]:text-white
                            [&_h2]:text-zinc-900 dark:[&_h2]:text-white
                            [&_h3]:text-zinc-900 dark:[&_h3]:text-white
                            [&_li]:text-zinc-900 dark:[&_li]:text-zinc-100
                            [&_strong]:text-zinc-900 dark:[&_strong]:text-white
                            prose-a:text-blue-600 dark:prose-a:text-blue-400 
                            hover:prose-a:text-blue-700 dark:hover:prose-a:text-blue-300`}
                            style={{ color: theme === 'light' ? '#000000' : '#ffffff' }}
                            dangerouslySetInnerHTML={{ __html: news.content }}
                        />

                        {/* Share / Footer */}
                        <div className="mt-10 pt-6 border-t border-zinc-800 flex justify-between items-center">
                            <div className="text-zinc-500 text-sm">
                                {t('news.share')}
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 rounded-full bg-zinc-800 text-zinc-400 hover:bg-blue-600 hover:text-white transition-colors">
                                    <Share2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 sticky top-24 shadow-sm dark:shadow-none">
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6 flex items-center gap-2">
                            <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                            {t('news.sidebar.title')}
                        </h3>

                        <div className="space-y-4">
                            {otherNews.map((item) => (
                                <div
                                    key={item._id}
                                    onClick={() => navigate(`/news/${item._id}`)}
                                    className="group cursor-pointer block border-b border-zinc-200 dark:border-zinc-800/50 last:border-0 pb-4 last:pb-0"
                                >
                                    <span className={`text-[10px] font-bold ${item.categoryColor} mb-1 block`}>
                                        {item.category}
                                    </span>
                                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-1">
                                        {language === 'th' ? item.title : (item.title_en || item.title)}
                                    </h4>
                                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                        {new Date(item.createdAt).toLocaleDateString(language === 'th' ? 'th-TH' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => navigate('/')}
                            className="w-full mt-6 py-3 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors text-sm font-medium"
                        >
                            {t('news.sidebar.view_all')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewsDetail;
