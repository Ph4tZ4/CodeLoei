import React, { useState, useEffect } from 'react';
import { Folder, X, Loader2, Save, Trash2, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import CustomSelect from './CustomSelect';

interface EditProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: any;
    onUpdate: (updatedProject: any) => void;
    onDelete: (deletedId: string) => void;
}

const EditProjectModal = ({ isOpen, onClose, project, onUpdate, onDelete }: EditProjectModalProps) => {
    const navigate = useNavigate();
    const [name, setName] = useState(project?.name || '');
    const [desc, setDesc] = useState(project?.description || '');
    const [lang, setLang] = useState(project?.language || 'TypeScript');
    const [visibility, setVisibility] = useState<'public' | 'private'>(project?.visibility || 'public');
    const [license, setLicense] = useState(project?.license || 'None');
    const [tags, setTags] = useState(project?.tags ? project.tags.join(', ') : '');
    const [loading, setLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [mode, setMode] = useState<'edit' | 'delete'>('edit');

    useEffect(() => {
        if (project) {
            setName(project.name);
            setDesc(project.description || '');
            setLang(project.language);
            setVisibility(project.visibility);
            setLicense(project.license || 'None');
            setTags(project.tags ? project.tags.join(', ') : '');
        }
    }, [project]);

    const isNameValid = name.length > 0 && /^[a-zA-Z0-9-_]+$/.test(name);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const res = await api.put(`/projects/${project._id}`, {
                name,
                description: desc,
                language: lang,
                visibility,
                license: license !== 'None' ? license : null,
                tags: tags.split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0),
            }, token || undefined);

            onUpdate(res);
            onClose();
        } catch (error) {
            console.error("Error updating project:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (deleteConfirm !== project.name) return;
        setIsDeleting(true);
        try {
            const token = localStorage.getItem('token');
            await api.delete(`/projects/${project._id}`, token || undefined);
            onDelete(project._id);
            onClose();
            navigate('/profile'); // Redirect to profile after delete
        } catch (error) {
            console.error("Error deleting project:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-2xl shadow-2xl animate-modal-in max-h-[90vh] overflow-y-auto custom-scrollbar">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-zinc-800 sticky top-0 bg-zinc-950 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            {mode === 'edit' ? <><Folder className="w-5 h-5 text-blue-500" /> Edit Project Settings</> : <><Trash2 className="w-5 h-5 text-red-500" /> Delete Project</>}
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {mode === 'edit' ? (
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">

                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-white mb-1.5">Repository Name</label>
                            <div className="relative">
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className={`w-full bg-black border ${isNameValid ? 'border-zinc-700 focus:border-blue-500' : 'border-red-500/50'} rounded-lg px-3 py-2.5 text-white outline-none transition-all`}
                                    required
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1.5">Description</label>
                            <textarea
                                value={desc}
                                onChange={(e) => setDesc(e.target.value)}
                                className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2.5 text-white focus:border-zinc-600 outline-none transition-all h-24 resize-none"
                            />
                        </div>

                        {/* Visibility & Lang */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5">Visibility</label>
                                <CustomSelect
                                    value={visibility}
                                    onChange={(val) => setVisibility(val as 'public' | 'private')}
                                    options={[
                                        { value: "public", label: "Public" },
                                        { value: "private", label: "Private" }
                                    ]}
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400 mb-1.5">Language</label>
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

                        {/* Tags */}
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1.5">Tags (comma separated)</label>
                            <input
                                value={tags}
                                onChange={(e) => setTags(e.target.value)}
                                className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2.5 text-white focus:border-white outline-none transition-all"
                            />
                        </div>

                        <div className="flex justify-between items-center pt-6 border-t border-zinc-800">
                            <button type="button" onClick={() => setMode('delete')} className="text-red-500 hover:text-red-400 text-sm font-medium flex items-center gap-1">
                                <Trash2 className="w-4 h-4" /> Delete Project
                            </button>

                            <div className="flex gap-3">
                                <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-zinc-900 rounded-lg transition-colors">Cancel</button>
                                <button
                                    type="submit"
                                    disabled={loading || !name}
                                    className="px-5 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-500 disabled:opacity-50 flex items-center gap-2 transition-all"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </form>
                ) : (
                    <div className="p-6 space-y-6">
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-red-500 font-bold text-sm">Danger Zone</h3>
                                <p className="text-red-400/80 text-xs mt-1">
                                    Deleting this project will permanently remove all files, stars, and history. This action cannot be undone.
                                </p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">
                                Please type <span className="text-white font-mono font-bold">{project.name}</span> to confirm.
                            </label>
                            <input
                                value={deleteConfirm}
                                onChange={(e) => setDeleteConfirm(e.target.value)}
                                className="w-full bg-black border border-zinc-800 focus:border-red-500 rounded-lg px-3 py-2.5 text-white outline-none transition-all"
                                placeholder={project.name}
                            />
                        </div>

                        <div className="flex justify-between items-center pt-2">
                            <button type="button" onClick={() => setMode('edit')} className="text-zinc-500 hover:text-white text-sm">Back to Settings</button>
                            <button
                                onClick={handleDelete}
                                disabled={deleteConfirm !== project.name || isDeleting}
                                className="px-5 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
                            >
                                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                Delete Permanently
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EditProjectModal;
