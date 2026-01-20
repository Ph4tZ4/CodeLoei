import { LayoutGrid, Folder } from 'lucide-react';
import ProjectCard from '../components/ProjectCard';
import type { Project } from '../types';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useState, useMemo } from 'react';
import CustomSelect from '../components/CustomSelect';

const AllProjects = ({ projects }: { projects: Project[] }) => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const location = useLocation();
    const [sortBy, setSortBy] = useState('latest');

    // Get search query from URL
    const searchParams = new URLSearchParams(location.search);
    const searchQuery = searchParams.get('search') || '';

    // Filter projects based on search query
    const filteredProjects = useMemo(() => {
        let result = projects;

        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            result = projects.filter(project => {
                const matchName = project.name.toLowerCase().includes(lowerQuery);
                const matchOwner = typeof project.ownerId === 'object'
                    ? project.ownerId.displayName.toLowerCase().includes(lowerQuery)
                    : false; // Should satisfy type check if ownerId is populated

                const matchTags = project.tags?.some(tag => tag.toLowerCase().includes(lowerQuery));

                return matchName || matchOwner || matchTags;
            });
        }

        return [...result].sort((a, b) => {
            if (sortBy === 'latest') {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            } else if (sortBy === 'name') {
                return a.name.localeCompare(b.name);
            } else if (sortBy === 'popular') {
                return (b.views || 0) - (a.views || 0);
            }
            return 0;
        });
    }, [projects, searchQuery, sortBy]);

    const sortOptions = [
        { value: 'latest', label: t('project.sort.latest') || 'Latest' },
        { value: 'name', label: t('project.sort.name') || 'Name' },
        { value: 'popular', label: t('project.sort.popular') || 'Popular' },
    ];

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
                <div className="w-full sm:w-48">
                    <CustomSelect
                        value={sortBy}
                        onChange={setSortBy}
                        options={sortOptions}
                        placeholder="Sort by"
                    />
                </div>
            </div>

            {filteredProjects.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-zinc-800 rounded-lg bg-zinc-900/20 animate-fade-in">
                    <Folder className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                    <h3 className="text-zinc-400 font-medium">
                        {searchQuery ? `No projects found matching "${searchQuery}"` : t('project.all.no_data')}
                    </h3>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredProjects.map((project, idx) => (
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
