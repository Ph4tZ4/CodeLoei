import { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { api } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext'; // Added hook
import { useAlert } from '../contexts/AlertContext';
import { User, Mail, MapPin, Globe, Loader2, Users, Star, Book, Activity, ShieldAlert, Lock } from 'lucide-react'; // Added ShieldAlert, Lock
import ProjectCard from '../components/ProjectCard';
import type { Project } from '../types';

interface PublicUser {
    _id: string;
    displayName: string;
    photoURL?: string;
    bio?: string;
    skills?: string[];
    location?: string;
    website?: string;
    publicEmail?: string;
    pinnedProjects: Project[];
    followersCount: number;
    followingCount: number;
    userType: string;
    isBanned?: boolean; // Added
    bannedUntil?: string; // Added (Date string)
    isFollowing?: boolean;
}

const UserProfile = () => {
    const { t } = useLanguage();
    const { alert } = useAlert();
    const { id } = useParams();
    const navigate = useNavigate();
    const context = useOutletContext<any>();
    const currentUser = context?.user;

    const [profile, setProfile] = useState<PublicUser | null>(null);
    const [userProjects, setUserProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [followLoading, setFollowLoading] = useState(false);
    const [error, setError] = useState('');

    // Redirect to own profile if viewing self
    useEffect(() => {
        if (currentUser && id && (currentUser._id === id || currentUser.id === id)) {
            navigate('/profile');
        }
    }, [currentUser, id, navigate]);

    useEffect(() => {
        const fetchProfileAndProjects = async () => {
            if (!id) return;
            try {
                const token = localStorage.getItem('token');
                // Parallel fetch
                const [profileData, projectsData] = await Promise.all([
                    api.getPublicProfile(id, token || undefined),
                    api.getProjectsByUser(id, token || undefined)
                ]);

                setProfile(profileData);
                setUserProjects(projectsData);
            } catch (err: any) {
                console.error("Failed to load profile data", err);
                setError(err.message || "Failed to load profile");
            } finally {
                setLoading(false);
            }
        };
        fetchProfileAndProjects();
    }, [id, currentUser]);

    const handleFollowToggle = async () => {
        if (!currentUser) {
            await alert("Please login to follow users.", undefined, 'info');
            return;
        }
        if (!profile) return;

        setFollowLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (token) {
                const res = await api.toggleFollowUser(profile._id, token);
                setProfile(prev => prev ? {
                    ...prev,
                    isFollowing: res.isFollowing,
                    followersCount: res.followersCount
                } : null);
            }
        } catch (err) {
            console.error("Follow error", err);
        } finally {
            setFollowLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;

    if (error || !profile) return (
        <div className="min-h-screen flex flex-col items-center justify-center text-zinc-500 gap-4">
            <Users className="w-16 h-16 opacity-20" />
            <p className="text-lg">{error || t('profile.not_found')}</p>
            <button onClick={() => navigate(-1)} className="text-blue-400 hover:underline">{t('profile.go_back')}</button>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
            {/* Header / Profile Card */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden mb-8 relative">
                {/* Banned Overlay/Banner */}
                {profile.isBanned && (
                    <div className="absolute top-0 left-0 right-0 bg-red-600/90 backdrop-blur-sm z-20 px-6 py-2 flex items-center justify-center gap-2 text-white font-bold shadow-lg">
                        <Lock className="w-4 h-4" />
                        {t('profile.banned_message')}
                    </div>
                )}

                <div className={`h-32 w-full relative ${profile.isBanned ? 'bg-zinc-800 grayscale' : 'bg-gradient-to-r from-blue-900/20 to-purple-900/20'}`}>
                    {/* Cover placeholder */}
                </div>
                <div className="px-8 pb-8 flex flex-col md:flex-row items-end md:items-start gap-6 -mt-12 relative z-10">
                    <div className="relative">
                        <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center overflow-hidden shadow-xl ${profile.isBanned ? 'border-red-600 grayscale bg-zinc-900' : 'border-black bg-zinc-800'}`}>
                            {profile.photoURL ? (
                                <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-12 h-12 text-zinc-500" />
                            )}
                        </div>
                        {!profile.isBanned && (
                            <span className={`absolute bottom-2 right-2 w-4 h-4 rounded-full border-2 border-black ${profile.userType === 'college_member' ? 'bg-blue-500' : 'bg-green-500'}`} title={profile.userType}></span>
                        )}
                        {profile.isBanned && (
                            <div className="absolute -bottom-1 -right-1 bg-red-600 text-white p-1.5 rounded-full border-4 border-black" title="Banned User">
                                <ShieldAlert className="w-4 h-4" />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 flex flex-col md:flex-row justify-between items-center md:items-end gap-4 w-full md:w-auto text-center md:text-left">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
                                {profile.displayName}
                                {profile.isBanned && (
                                    <span className="bg-red-500/20 text-red-500 border border-red-500/30 text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                                        {t('profile.banned')}
                                    </span>
                                )}
                            </h1>
                            <p className="text-zinc-400 text-lg mb-2">{profile.bio || t('profile.no_bio')}</p>

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-zinc-500 mt-3">
                                <div className="flex items-center gap-1 hover:text-zinc-300 transition-colors cursor-default">
                                    <Users className="w-4 h-4" />
                                    <span className="font-bold text-white">{profile.followersCount}</span> {t('profile.followers')}
                                </div>
                                <div className="flex items-center gap-1 hover:text-zinc-300 transition-colors cursor-default">
                                    <Activity className="w-4 h-4" />
                                    <span className="font-bold text-white">{profile.followingCount}</span> {t('profile.following')}
                                </div>
                                {profile.location && (
                                    <div className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {profile.location}</div>
                                )}
                                {profile.website && (
                                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-400 hover:underline">
                                        <Globe className="w-4 h-4" /> {t('profile.website')}
                                    </a>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleFollowToggle}
                                disabled={followLoading || Boolean(profile.isBanned)}
                                className={`relative z-50 px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${profile.isBanned
                                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed opacity-50'
                                    : profile.isFollowing
                                        ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border border-zinc-700'
                                        : 'bg-white text-black hover:bg-gray-200'
                                    }`}
                            >
                                {followLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                {profile.isFollowing ? t('profile.unfollow') : t('profile.follow')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 ${profile.isBanned ? 'opacity-50 pointer-events-none grayscale-[0.5]' : ''}`}>
                {/* Main Content: Projects */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Pinned Projects */}
                    {profile.pinnedProjects && profile.pinnedProjects.length > 0 && (
                        <div>
                            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Star className="w-5 h-5 text-yellow-500" /> {t('profile.pinned')}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {profile.pinnedProjects.map((project, idx) => (
                                    <ProjectCard
                                        key={project?._id || idx}
                                        project={project}
                                        index={idx}
                                        onClick={() => navigate(`/projects/${project._id}`)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* All Projects */}
                    <div>
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <Book className="w-5 h-5 text-blue-500" /> {t('profile.repositories')}
                        </h2>
                        {userProjects.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {userProjects.map((project, idx) => (
                                    <ProjectCard
                                        key={project._id || idx}
                                        project={project}
                                        index={idx}
                                        onClick={() => navigate(`/projects/${project._id}`)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-xl p-6 text-center text-zinc-500">
                                {t('profile.no_repos')}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar: Details/Skills */}
                <div className="space-y-6">
                    {profile.skills && profile.skills.length > 0 && (
                        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6">
                            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">{t('profile.skills')}</h3>
                            <div className="flex flex-wrap gap-2">
                                {profile.skills.map(skill => (
                                    <span key={skill} className="px-2.5 py-1 bg-zinc-800 text-zinc-300 rounded text-xs border border-zinc-700">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {profile.publicEmail && (
                        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6">
                            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">{t('profile.contact')}</h3>
                            <div className="flex items-center gap-3 text-sm text-zinc-300">
                                <Mail className="w-4 h-4 text-zinc-500" />
                                <a href={`mailto:${profile.publicEmail}`} className="hover:text-blue-400 transition-colors">{profile.publicEmail}</a>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
