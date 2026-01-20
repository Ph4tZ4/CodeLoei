import { useState, useEffect } from 'react';
import { Folder, Loader2, Star, Eye } from 'lucide-react';

import type { Project } from '../types';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { api } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';

const MyProjects = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    const context = useOutletContext<any>() || {}; // Fallback empty object
    const user = context.user;

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const token = localStorage.getItem('token');

                // Use context user if available
                if (user && user._id) {
                    const projectData = await api.getProjectsByUser(user._id, token || undefined);
                    setProjects(projectData);
                }
            } catch (err) {
                console.error("Failed to load my projects", err);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchProjects();
        } else {
            // If user context not ready (edge case), might need to wait or it matches <Route> logic
            // But Route protects it, so user should be there.
            // Just in case, if context is missing but we have token, maybe we could fallback, 
            // but App.tsx ensures 'user' is loaded before rendering protected routes.
            // So we should be safe.
        }
    }, [user, navigate]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="animate-fade-in max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
                        <Folder className="w-6 h-6 text-white" /> {t('project.my.title')}
                    </h2>
                    <p className="text-gray-500 text-sm">
                        {t('project.my.desc')} ({projects.length})
                    </p>
                </div>
            </div>

            {projects.length === 0 ? (
                <div className="text-center py-24 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/10 animate-fade-in flex flex-col items-center">
                    <div className="w-16 h-16 bg-zinc-800/50 rounded-full flex items-center justify-center mb-6">
                        <Folder className="w-8 h-8 text-zinc-600" />
                    </div>
                    <h3 className="text-xl font-medium text-white mb-2">{t('project.my.empty_title')}</h3>
                    <p className="text-zinc-500 max-w-sm mx-auto mb-8">
                        {t('project.my.empty_desc')}
                    </p>
                </div>
            ) : (
                <div className="flex flex-col space-y-3">
                    {projects.map((project, idx) => (
                        <div
                            key={project._id || idx}
                            onClick={() => navigate(`/projects/${project._id}`)}
                            className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-black/40 backdrop-blur-sm border border-zinc-800 hover:border-zinc-600 rounded-lg p-4 transition-all duration-200 hover:bg-zinc-900/50 cursor-pointer"
                            style={{ animationDelay: `${idx * 0.05}s` }}
                        >
                            {/* Icon / Type Indicator */}
                            <div className="flex-shrink-0 mt-1 sm:mt-0">
                                <div className="w-10 h-10 rounded-lg  bg-zinc-800/50 flex items-center justify-center border border-zinc-700/50 group-hover:border-zinc-600">
                                    <Folder className="w-5 h-5 text-blue-400" />
                                </div>
                            </div>

                            {/* Main Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-white font-medium truncate group-hover:text-blue-400 transition-colors">
                                        {project.name}
                                    </h3>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border border-zinc-700/50 ${project.visibility === 'private' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-green-500/10 text-green-500'
                                        }`}>
                                        {project.visibility === 'private' ? 'Private' : 'Public'}
                                    </span>
                                </div>
                                <p className="text-gray-500 text-sm truncate max-w-2xl">
                                    {project.description || 'No description provided.'}
                                </p>
                            </div>

                            {/* Stats & Meta */}
                            <div className="flex items-center gap-4 sm:ml-auto text-xs text-gray-500">
                                <div className="flex items-center gap-1.5 min-w-[60px]">
                                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                    {project.language}
                                </div>
                                <div className="flex items-center gap-1">
                                    <Star className="w-3.5 h-3.5" />
                                    {project.stars}
                                </div>
                                <div className="flex items-center gap-1 hidden sm:flex">
                                    <Eye className="w-3.5 h-3.5" />
                                    {project.views}
                                </div>
                                <div className="flex items-center gap-1">
                                    <span className="text-xs text-zinc-600">Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyProjects;
