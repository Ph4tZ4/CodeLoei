import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { News } from '../types';
import { X } from 'lucide-react';

export default function NewsPopup() {
    const [popupNews, setPopupNews] = useState<News | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const checkPopup = async () => {
            try {
                // Fetch all news - optimization: backend should ideally have /news/popups endpoint, 
                // but filtering client-side for now as requested task scope implies modification of existing systems
                const newsList: News[] = await api.get('/news');

                // Get closed popups from local storage
                const closedPopups = JSON.parse(localStorage.getItem('closed_popups') || '[]');

                // Find active popup
                // Prioritize latest created
                const activePopup = newsList.find(news => {
                    if (!news.isPopup) return false;

                    // Check if expired
                    if (news.popupExpiresAt) {
                        const expiry = new Date(news.popupExpiresAt);
                        if (expiry < new Date()) return false;

                        // Also check if duration logic in backend worked, allowing for some margin?
                        // Actually trust backend field.
                    }

                    // Check if closed by user
                    if (closedPopups.includes(news._id)) return false;

                    return true;
                });

                if (activePopup) {
                    setPopupNews(activePopup);
                    // Add small delay for animation
                    setTimeout(() => setIsVisible(true), 1000);
                }
            } catch (err) {
                console.error('Failed to fetch news popups', err);
            }
        };

        checkPopup();
    }, []);

    const handleClose = () => {
        if (!popupNews) return;
        setIsVisible(false);

        // Save to local storage
        const closedPopups = JSON.parse(localStorage.getItem('closed_popups') || '[]');
        if (!closedPopups.includes(popupNews._id)) {
            closedPopups.push(popupNews._id);
            localStorage.setItem('closed_popups', JSON.stringify(closedPopups));
        }

        // Remove from DOM after animation
        setTimeout(() => setPopupNews(null), 300);
    };

    if (!popupNews) return null;

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center px-4 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Content */}
            <div className={`relative bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>

                {/* Header */}
                <div className={`p-4 border-b border-zinc-800 flex justify-between items-center ${popupNews.category === 'URGENT' ? 'bg-red-500/10' : 'bg-zinc-800/30'
                    }`}>
                    <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border border-current ${popupNews.categoryColor || 'text-blue-400'}`}>
                            {popupNews.category}
                        </span>
                        <span className="text-zinc-500 text-xs">
                            {new Date(popupNews.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-1 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <h2 className="text-xl font-bold text-white mb-4">
                        {popupNews.title}
                    </h2>

                    <div
                        className="prose prose-invert max-w-none text-sm text-zinc-300"
                        dangerouslySetInnerHTML={{ __html: popupNews.content }}
                    />
                </div>


            </div>
        </div>
    );
}
