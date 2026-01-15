import { useState, useEffect } from 'react';
import { Folder, Loader2 } from 'lucide-react';
import ProjectCard from '../components/ProjectCard';
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
        <div className="animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-white">
                        <Folder className="w-6 h-6 text-white" /> {t('project.my.title')}
                    </h2>
                    <p className="text-gray-500 text-sm">
                        {t('project.my.desc')} ({projects.length})
                    </p>
                </div>
                {/* Optional: Add "Create Project" button here if desired, 
                    but Navbar already has one. Keeping it clean or adding redundancy is fine.
                    Let's stick to clean for now, Navbar has the primary action.
                 */}
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
                    {/* Only show create button if user is college_member (checked via type usually, 
                        or just fail gracefully if they try. Navbar handles permission check for button visibility.
                        We can double check userType here if we want to show a button.)
                     */}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project, idx) => (
                        <div key={project._id || idx} className="relative group">
                            <ProjectCard
                                project={project}
                                index={idx}
                                onClick={() => navigate(`/projects/${project._id}`)}
                            />
                            {/* Overlay Badge for Private Projects if needed, 
                                though Card usually shows it. 
                                ProjectCard handles visibility icon.
                             */}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyProjects;
