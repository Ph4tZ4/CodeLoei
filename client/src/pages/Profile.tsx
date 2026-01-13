import { useState, useEffect } from 'react';
import { Mail, MapPin, Edit2, Users, Activity, Link as LinkIcon, Calendar, Code, Star, GitCommit, Loader2, Pin as PinIcon } from 'lucide-react';
import { api } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
// import type { Project } from '../types';

interface ProfileProps {
    user: any;
}

const Profile = ({ user: contextUser }: ProfileProps) => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    // const { refreshProjects } = useOutletContext<any>(); // Unused for now

    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Projects State
    const [userProjects, setUserProjects] = useState<any[]>([]);
    const [loadingProjects, setLoadingProjects] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            const token = localStorage.getItem('token');
            if (!token && !contextUser) {
                setLoading(false);
                setLoadingProjects(false);
                return;
            }

            try {
                // 1. Fetch Profile
                let userData = contextUser;
                if (token) {
                    try {
                        userData = await api.get('/auth/me', token);
                        setProfile(userData);
                    } catch (e) {
                        console.error("Auth me failed", e);
                        if (contextUser) setProfile(contextUser);
                    }
                } else {
                    setProfile(contextUser);
                }

                // 2. Fetch Projects
                if (userData && (userData._id || userData.id)) {
                    const userId = userData._id || userData.id;
                    const projs = await api.get(`/projects/user/${userId}`, token || undefined);
                    setUserProjects(projs);
                }

            } catch (err) {
                console.error("Failed to fetch profile data", err);
            } finally {
                setLoading(false);
                setLoadingProjects(false);
            }
        };
        fetchUserData();
    }, [contextUser]);

    if (loading || !profile) return <div className="text-white text-center mt-20">{t('profile.loading')}</div>;

    const pinnedProjects = profile.pinnedProjects || [];

    return (
        <div className="animate-fade-in">
            {/* ... Cover ... */}
            <div className="relative h-48 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-xl border border-white/5 mb-24">
                {/* ... (Existing Cover Code) ... */}
                <div className="absolute -bottom-16 left-8 flex items-end gap-6">
                    <div className="w-32 h-32 rounded-full ring-4 ring-black bg-zinc-800 flex items-center justify-center overflow-hidden">
                        {profile.photoURL ? (
                            <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-4xl font-bold text-white">{profile.displayName?.charAt(0).toUpperCase()}</span>
                        )}
                    </div>
                    <div className="mb-2">
                        <h1 className="text-3xl font-bold text-white">{profile.displayName}</h1>
                        <p className="text-zinc-400 text-lg mb-2">{profile.bio || t('profile.no_bio')}</p>
                        <div className="flex items-center gap-4 text-sm text-zinc-500">
                            <div className="flex items-center gap-1 hover:text-zinc-300 transition-colors cursor-default">
                                <Users className="w-4 h-4" />
                                <span className="font-bold text-white">{profile.followers?.length || 0}</span> {t('profile.followers')}
                            </div>
                            <div className="flex items-center gap-1 hover:text-zinc-300 transition-colors cursor-default">
                                <Activity className="w-4 h-4" />
                                <span className="font-bold text-white">{profile.following?.length || 0}</span> {t('profile.following')}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="absolute top-4 right-4">
                    <button
                        onClick={() => navigate('/settings')}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg backdrop-blur-sm flex items-center gap-2 text-sm font-medium transition-colors"
                    >
                        <Edit2 className="w-4 h-4" /> {t('profile.edit')}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Left Sidebar (same as before) */}
                <div className="space-y-6">
                    <div className="space-y-4 text-sm text-zinc-400">
                        {profile.location && (
                            <div className="flex items-center gap-3">
                                <MapPin className="w-4 h-4 text-zinc-500" />
                                {profile.location}
                            </div>
                        )}
                        {profile.publicEmail && (
                            <div className="flex items-center gap-3">
                                <Mail className="w-4 h-4 text-zinc-500" />
                                <a href={`mailto:${profile.publicEmail}`} className="hover:text-white transition-colors">{profile.publicEmail}</a>
                            </div>
                        )}
                        {profile.website && (
                            <div className="flex items-center gap-3">
                                <LinkIcon className="w-4 h-4 text-zinc-500" />
                                <a href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate max-w-[200px]">{profile.website}</a>
                            </div>
                        )}
                        <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-zinc-500" />
                            {t('profile.joined')} {new Date(profile.createdAt).toLocaleDateString()}
                        </div>
                    </div>

                    <div className="border-t border-zinc-800 pt-6">
                        <h3 className="font-bold text-white mb-4">{t('profile.skills')}</h3>
                        <div className="flex flex-wrap gap-2">
                            {profile.skills && profile.skills.length > 0 ? (
                                profile.skills.map((skill: string, i: number) => (
                                    <span key={i} className="bg-zinc-900 text-text-muted px-3 py-1 rounded-full text-xs font-medium border border-zinc-800">
                                        {skill}
                                    </span>
                                ))
                            ) : (
                                <span className="text-zinc-600 text-xs italic">{t('profile.no_skills')}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="lg:col-span-3 space-y-8">
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-zinc-900/30 border border-zinc-800 p-4 rounded-xl text-center">
                            <div className="text-2xl font-bold text-white mb-1">{profile.pinnedProjects?.length || 0}</div>
                            <div className="text-xs text-zinc-500">Pinned</div>
                        </div>
                        <div className="bg-zinc-900/30 border border-zinc-800 p-4 rounded-xl text-center">
                            <div className="text-2xl font-bold text-white mb-1">{userProjects.length}</div>
                            <div className="text-xs text-zinc-500">{t('profile.repositories')}</div>
                        </div>
                        {/* Placeholder for Total Stars */}
                        <div className="bg-zinc-900/30 border border-zinc-800 p-4 rounded-xl text-center">
                            <div className="text-2xl font-bold text-white mb-1">{userProjects.reduce((acc, curr) => acc + (curr.stars || 0), 0)}</div>
                            <div className="text-xs text-zinc-500">{t('profile.total_stars')}</div>
                        </div>
                    </div>

                    {/* Pinned Projects */}
                    {pinnedProjects.length > 0 && (
                        <div>
                            <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2"><PinIcon className="w-5 h-5 text-blue-500" /> {t('profile.pinned')}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {pinnedProjects.map((proj: any) => (
                                    proj && typeof proj === 'object' ? (
                                        <div key={proj._id} onClick={() => navigate(`/projects/${proj._id}`)} className="bg-zinc-900/30 border border-zinc-800 p-5 rounded-xl hover:border-zinc-600 transition-colors cursor-pointer group">
                                            <div className="flex justify-between items-start mb-3">
                                                <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors">{proj.name}</h4>
                                                <span className={`text-xs border px-2 py-0.5 rounded-full ${proj.visibility === 'public' ? 'border-blue-500/30 text-blue-400' : 'border-yellow-500/30 text-yellow-400'}`}>
                                                    {proj.visibility}
                                                </span>
                                            </div>
                                            <p className="text-sm text-zinc-500 mb-4 line-clamp-2">{proj.description || "No description"}</p>
                                            <div className="flex items-center gap-4 text-xs text-zinc-500">
                                                <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> {proj.language}</span>
                                                <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {proj.stars || 0}</span>
                                            </div>
                                        </div>
                                    ) : null
                                ))}
                            </div>
                        </div>
                    )}

                    {/* All Projects */}
                    <div>
                        <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2"><Code className="w-5 h-5 text-green-500" /> {t('profile.repositories')}</h3>
                        {loadingProjects ? (
                            <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" /></div>
                        ) : userProjects.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {userProjects.map((proj: any) => (
                                    <div key={proj._id} onClick={() => navigate(`/projects/${proj._id}`)} className="bg-zinc-900/30 border border-zinc-800 p-5 rounded-xl hover:border-zinc-600 transition-colors cursor-pointer group">
                                        <div className="flex justify-between items-start mb-3">
                                            <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors">{proj.name}</h4>
                                            <span className={`text-xs border px-2 py-0.5 rounded-full ${proj.visibility === 'public' ? 'border-blue-500/30 text-blue-400' : 'border-yellow-500/30 text-yellow-400'}`}>
                                                {proj.visibility}
                                            </span>
                                        </div>
                                        <p className="text-sm text-zinc-500 mb-4 line-clamp-2">{proj.description || "No description"}</p>
                                        <div className="flex items-center gap-4 text-xs text-zinc-500">
                                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> {proj.language}</span>
                                            <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {proj.stars || 0}</span>
                                            <span className="flex items-center gap-1"><GitCommit className="w-3 h-3" /> {new Date(proj.updatedAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-zinc-500 text-sm italic py-8 border border-dashed border-zinc-800 rounded-xl text-center">
                                {t('profile.no_repos')}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
export default Profile;
