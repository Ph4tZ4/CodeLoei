import { Lock, Book, Star, ShieldAlert } from 'lucide-react';
import type { Project } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface ProjectCardProps {
    project: Project;
    index: number;
    onClick: () => void;
}

const ProjectCard = ({ project, index, onClick }: ProjectCardProps) => {
    // Helper to check ban status safely
    const isOwnerBanned = typeof project.ownerId !== 'string' && project.ownerId?.isBanned;
    const { t } = useLanguage();

    return (
        <div
            onClick={onClick}
            className={`group relative bg-black/40 backdrop-blur-sm border ${isOwnerBanned ? 'border-red-900/30' : 'border-zinc-800'} hover:border-zinc-500 rounded-lg p-4 transition-all duration-300 hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] animate-fade-in cursor-pointer flex flex-col h-full`}
            style={{ animationDelay: `${index * 0.05}s` }}
        >
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                    {project.visibility === 'private' ? (
                        <Lock className="w-4 h-4 text-yellow-500/80" />
                    ) : (
                        <Book className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                    )}
                    <h3 className="text-white font-semibold group-hover:text-blue-400 transition-colors truncate max-w-[200px]">
                        {project.name}
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded-full border border-zinc-700 text-zinc-400 bg-zinc-900">
                        {project.visibility === 'private' ? t('project.card.private') : project.language}
                    </span>
                </div>
                <div className="flex items-center gap-1 text-gray-500 text-xs">
                    <Star className="w-3 h-3 text-yellow-500" /> {project.stars}
                </div>
            </div>

            <p className="text-gray-400 text-sm mb-4 line-clamp-2 flex-1">
                {project.description}
            </p>

            <div className="flex items-center justify-between text-xs text-gray-600 mt-auto pt-4 border-t border-zinc-900">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isOwnerBanned ? 'bg-red-500' : 'bg-green-500'} animate-pulse`}></div>
                    <span className="truncate max-w-[150px] flex items-center gap-1">
                        {typeof project.ownerId !== 'string' ? project.ownerId.displayName : t('project.card.unknown_user')}
                        {isOwnerBanned && <ShieldAlert className="w-3 h-3 text-red-500" />}
                    </span>
                </div>
                <span className="font-mono text-zinc-500">Public</span>
            </div>
        </div>
    );
};

export default ProjectCard;
