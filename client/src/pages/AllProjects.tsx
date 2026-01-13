import { LayoutGrid, Folder } from 'lucide-react';
import ProjectCard from '../components/ProjectCard';
import type { Project } from '../types';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const AllProjects = ({ projects }: { projects: Project[] }) => {
    const navigate = useNavigate();
    const { t } = useLanguage();

    return (
        <div className="animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <LayoutGrid className="w-6 h-6 text-white" /> {t('project.all.title')}
                    </h2>
                    <p className="text-gray-500 text-sm">
                        {t('project.all.desc')}
                    </p>
                </div>
            </div>

            {projects.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-zinc-800 rounded-lg bg-zinc-900/20 animate-fade-in">
                    <Folder className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                    <h3 className="text-zinc-400 font-medium">{t('project.all.no_data')}</h3>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects.map((project, idx) => (
                        <ProjectCard
                            key={project._id || idx}
                            project={project}
                            index={idx}
                            onClick={() => navigate(`/projects/${project._id}`)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
export default AllProjects;
