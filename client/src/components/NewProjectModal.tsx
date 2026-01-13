import React, { useState } from 'react';
import { Folder, X, ChevronDown, Check, CheckCircle2, Globe, Lock, Code, Hash, Loader2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';
import CustomSelect from './CustomSelect';


const gitignoreTemplates = ["None", "Node", "Python", "Java", "React", "Go", "C++", "Unity"];
const licenseTemplates = ["None", "MIT License", "Apache License 2.0", "GNU GPLv3", "BSD 3-Clause"];

interface NewProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
}

const NewProjectModal = ({ isOpen, onClose, user }: NewProjectModalProps) => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const [lang, setLang] = useState('TypeScript');
    const [visibility, setVisibility] = useState<'public' | 'private'>('public');
    const [initReadme, setInitReadme] = useState(false);
    const [gitignore, setGitignore] = useState('None');
    const [license, setLicense] = useState('None');
    const [tags, setTags] = useState('');
    const [loading, setLoading] = useState(false);

    const isNameValid = name.length > 0 && /^[a-zA-Z0-9-_]+$/.test(name);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) return;
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const res = await api.post('/projects', {
                name,
                description: desc,
                language: lang,
                visibility,
                license: license !== 'None' ? license : null,
                tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
                initReadme,
                gitignore: gitignore !== 'None' ? gitignore : null,
                // license is already passed above
            }, token || undefined);

            onClose();
            setGitignore('None');
            setLicense('None');
            setTags('');

            if (res && res._id) {
                navigate(`/projects/${res._id}/setup`);
            } else if (res && res.id) {
                navigate(`/projects/${res.id}/setup`);
            }

            // Reset form
            setName('');
            setDesc('');
            setVisibility('public');
            setInitReadme(false);
            setGitignore('None');
            setLicense('None');
            setTags('');
        } catch (error) {
            console.error("Error creating project:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-2xl shadow-2xl animate-modal-in max-h-[90vh] overflow-y-auto custom-scrollbar">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-zinc-800 sticky top-0 bg-zinc-950 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Folder className="w-5 h-5 text-blue-500" /> {t('new_project.title')}
                        </h2>
                        <p className="text-xs text-zinc-500 mt-1">{t('new_project.subtitle')}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-8">

                    {/* Name & Owner */}
                    <div className="flex flex-col md:flex-row gap-4 items-start">
                        <div className="w-full md:w-1/3">
                            <label className="block text-sm font-medium text-gray-400 mb-1.5">{t('new_project.owner')}</label>
                            <div className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-gray-300 flex items-center gap-2 cursor-pointer hover:bg-zinc-800 hover:border-zinc-700 transition-all group">
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                                    {user.photoURL ? (
                                        <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}</span>
                                    )}
                                </div>
                                <span className="font-medium text-white group-hover:text-blue-400 truncate max-w-[120px]">{user.displayName || user.email?.split('@')[0]}</span>
                                <ChevronDown className="w-3 h-3 ml-auto text-zinc-500" />
                            </div>
                        </div>
                        <div className="hidden md:flex items-center justify-center pt-8 text-zinc-600">
                            <span className="text-xl">/</span>
                        </div>
                        <div className="w-full md:flex-1">
                            <label className="block text-sm font-medium text-white mb-1.5">{t('new_project.repo_name')} <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className={`w-full bg-black border ${isNameValid ? 'border-green-500/50 focus:border-green-500' : 'border-zinc-700 focus:border-blue-500'} rounded-lg px-3 py-2.5 text-white outline-none transition-all pr-10`}
                                    placeholder="my-awesome-project"
                                    required
                                />
                                {isNameValid && (
                                    <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                                )}
                            </div>
                            {isNameValid && <p className="text-[10px] text-green-500 mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {t('new_project.name_available')}</p>}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1.5">{t('new_project.description')} <span className="text-zinc-600 text-xs">{t('new_project.optional')}</span></label>
                        <input
                            value={desc}
                            onChange={(e) => setDesc(e.target.value)}
                            className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2.5 text-white focus:border-zinc-600 outline-none transition-all"
                            placeholder={t('new_project.description_placeholder')}
                        />
                    </div>

                    <div className="h-px bg-zinc-800 w-full"></div>

                    {/* Visibility */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-3">{t('new_project.visibility')}</label>
                        <div className="space-y-3">
                            <label className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${visibility === 'public' ? 'bg-blue-500/5 border-blue-500/50' : 'bg-black border-zinc-800 hover:border-zinc-600'}`}>
                                <div className="mt-0.5">
                                    <input
                                        type="radio"
                                        name="visibility"
                                        value="public"
                                        checked={visibility === 'public'}
                                        onChange={() => setVisibility('public')}
                                        className="accent-blue-500 w-4 h-4"
                                    />
                                </div>
                                <div className={`p-2 rounded-lg ${visibility === 'public' ? 'bg-blue-500 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                                    <Globe className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className={`font-bold text-sm ${visibility === 'public' ? 'text-white' : 'text-zinc-300'}`}>{t('new_project.public')}</div>
                                    <div className="text-xs text-zinc-500 mt-1 leading-relaxed">{t('new_project.public_desc')}</div>
                                </div>
                            </label>

                            <label className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${visibility === 'private' ? 'bg-yellow-500/5 border-yellow-500/50' : 'bg-black border-zinc-800 hover:border-zinc-600'}`}>
                                <div className="mt-0.5">
                                    <input
                                        type="radio"
                                        name="visibility"
                                        value="private"
                                        checked={visibility === 'private'}
                                        onChange={() => setVisibility('private')}
                                        className="accent-yellow-500 w-4 h-4"
                                    />
                                </div>
                                <div className={`p-2 rounded-lg ${visibility === 'private' ? 'bg-yellow-500 text-black' : 'bg-zinc-800 text-zinc-400'}`}>
                                    <Lock className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className={`font-bold text-sm ${visibility === 'private' ? 'text-white' : 'text-zinc-300'}`}>{t('new_project.private')}</div>
                                    <div className="text-xs text-zinc-500 mt-1 leading-relaxed">{t('new_project.private_desc')}</div>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="h-px bg-zinc-800 w-full"></div>

                    {/* Initialize */}
                    <div>
                        <label className="block text-sm font-medium text-white mb-4">{t('new_project.init_with')}</label>
                        <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4 space-y-5">
                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input
                                    type="checkbox"
                                    checked={initReadme}
                                    onChange={(e) => setInitReadme(e.target.checked)}
                                    className="mt-1 accent-green-500 w-4 h-4 rounded"
                                />
                                <div>
                                    <div className="font-medium text-white text-sm group-hover:text-green-400 transition-colors">{t('new_project.add_readme')}</div>
                                    <div className="text-xs text-zinc-500 mt-0.5">{t('new_project.readme_desc')}</div>
                                </div>
                            </label>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-medium text-gray-400 ml-1">{t('new_project.add_gitignore')}</label>
                                    <CustomSelect
                                        value={gitignore}
                                        onChange={(val) => setGitignore(val)}
                                        options={gitignoreTemplates.map(template => ({
                                            value: template,
                                            label: template === 'None' ? t('new_project.no_gitignore') : template
                                        }))}
                                        className="w-full"
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-medium text-gray-400 ml-1">{t('new_project.select_license')}</label>
                                    <CustomSelect
                                        value={license}
                                        onChange={(val) => setLicense(val)}
                                        options={licenseTemplates.map(l => ({
                                            value: l,
                                            label: l === 'None' ? t('new_project.no_license') : l
                                        }))}
                                        className="w-full"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-zinc-800 w-full"></div>

                    {/* Advanced & Tags */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1.5">{t('new_project.main_language')}</label>
                            <div className="relative">
                                <Code className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <CustomSelect
                                    value={lang}
                                    onChange={(val) => setLang(val)}
                                    options={[
                                        { value: "TypeScript", label: "TypeScript" },
                                        { value: "JavaScript", label: "JavaScript" },
                                        { value: "Python", label: "Python" },
                                        { value: "Java", label: "Java" },
                                        { value: "C#", label: "C#" },
                                        { value: "Go", label: "Go" },
                                        { value: "Rust", label: "Rust" }
                                    ]}
                                    className="w-full"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1.5">{t('new_project.tags')}</label>
                            <div className="relative">
                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <input
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                    className="w-full bg-black border border-zinc-800 rounded-lg pl-9 pr-3 py-2.5 text-white focus:border-white outline-none transition-all"
                                    placeholder="react, web, api"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6 border-t border-zinc-800">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 text-sm font-medium text-gray-400 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors">{t('common.cancel')}</button>
                        <button
                            type="submit"
                            disabled={loading || !name}
                            className="px-8 py-2.5 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-lg shadow-green-900/20"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            {t('new_project.create')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default NewProjectModal;
