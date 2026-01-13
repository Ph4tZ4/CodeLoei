
// ... imports
import { ArrowLeft, GitCommit, FileCode, Folder, Download, Star, ExternalLink, Clock, Loader2, Pin as PinIcon, Pencil, Trash2, Upload, X, Save, AlertTriangle, ChevronDown, ShieldAlert } from 'lucide-react';
// import EditProjectModal from '../components/EditProjectModal'; // Removed as we use inline editing now
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { api } from '../lib/api';
import type { Project, FileNode } from '../types';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import ReactMarkdown from 'react-markdown';
import CustomSelect from '../components/CustomSelect';
import { useLanguage } from '../contexts/LanguageContext';
import { useAlert } from '../contexts/AlertContext';

// Conflict Modal Component (Inline for simplicity or separate later)
interface ConflictModalProps {
    isOpen: boolean;
    fileName: string;
    onReplace: () => void;
    onKeepBoth: () => void;
    onCancel: () => void;
}

const ConflictModal = ({ isOpen, fileName, onReplace, onKeepBoth, onCancel }: ConflictModalProps) => {
    const { t } = useLanguage();
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-md w-full shadow-2xl animate-fade-in">
                <div className="flex items-center gap-3 text-yellow-500 mb-4">
                    <AlertTriangle className="w-6 h-6" />
                    <h3 className="text-lg font-bold text-white">{t('repo.conflict.title')}</h3>
                </div>
                <p className="text-zinc-300 mb-6">
                    {t('repo.conflict.desc')} <span className="text-white font-mono font-bold">{fileName}</span> {t('repo.conflict.action')}
                </p>
                <div className="flex flex-col gap-3">
                    <button onClick={onReplace} className="w-full py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 font-medium transition-colors">
                        {t('repo.conflict.replace')}
                    </button>
                    <button onClick={onKeepBoth} className="w-full py-2.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 font-medium transition-colors">
                        {t('repo.conflict.keep')}
                    </button>
                    <button onClick={onCancel} className="w-full py-2.5 bg-zinc-800 text-zinc-400 border border-zinc-700 rounded-lg hover:bg-zinc-700 font-medium transition-colors">
                        {t('repo.conflict.cancel')}
                    </button>
                </div>
            </div>
        </div>
    );
};

const RepoDetail = () => {
    const { t } = useLanguage();
    const { alert, confirm: confirmModal } = useAlert();
    const navigate = useNavigate();
    const { id } = useParams();
    const [project, setProject] = useState<Project | null>(null);
    const [files, setFiles] = useState<FileNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [starring, setStarring] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [readmeContent, setReadmeContent] = useState<string | null>(null);
    const [isPinned, setIsPinned] = useState(false); // Fix: Added missing state

    // Edit States
    const [editMode, setEditMode] = useState<{ [key: string]: boolean }>({}); // 'name', 'desc', 'tags'
    const [editValues, setEditValues] = useState<{ [key: string]: string }>({});
    const [saving, setSaving] = useState(false);

    // File Upload States
    // Handled in File Upload Handlers section below


    // Context from App.tsx via MainLayout via Outlet
    const context = useOutletContext<any>() || {};
    const { user, refreshUser, refreshProjects } = context;

    useEffect(() => {
        const fetchProjectData = async () => {
            if (!id) return;
            try {
                const token = localStorage.getItem('token');
                const projData = await api.get(`/projects/${id}`, token || undefined);
                setProject(projData);
                setEditValues({
                    name: projData.name,
                    description: projData.description || '',
                    tags: projData.tags ? projData.tags.join(', ') : '',
                    visibility: projData.visibility // Initialize visibility
                });

                // Check pin status if user logged in
                if (user && projData.pinnedBy && projData.pinnedBy.includes(user._id || user.id)) {
                    setIsPinned(true);
                }

                const filesData = await api.getProjectFiles(id);
                setFiles(filesData);

                const readme = filesData.find((f: any) => f.name.toLowerCase() === 'readme.md');
                if (readme) {
                    try {
                        const fileData = await api.getFileContent(id, readme.path);
                        setReadmeContent(fileData.content);
                    } catch (err) { console.error(err); }
                }

                if (token) await api.recordProjectView(id, token);
            } catch (err) {
                console.error("Failed to fetch project data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProjectData();
    }, [id, user]); // Added user dependency for pin check

    const isOwner = user && project && (typeof project.ownerId === 'string' ? project.ownerId === (user._id || user.id) : project.ownerId._id === (user._id || user.id));

    // Inline Edit Handlers
    const toggleEdit = (field: string) => {
        setEditMode(prev => ({ ...prev, [field]: !prev[field] }));
        if (!editMode[field] && project) {
            // Reset value on open
            setEditValues(prev => ({
                ...prev,
                name: project.name,
                description: project.description || '',
                tags: project.tags ? project.tags.join(', ') : '',
                visibility: project.visibility // Reset visibility
            }));
        }
    };

    const handleSaveField = async (field: string) => {
        if (!project) return;
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            // We use full payload approach as per previous logic
            const fullPayload = {
                name: field === 'name' ? editValues.name : project.name,
                description: field === 'description' ? editValues.description : project.description,
                language: project.language,
                visibility: field === 'visibility' ? editValues.visibility : project.visibility, // Handle new visibility
                license: project.license,
                tags: (field === 'tags' ? editValues.tags : (project.tags || []).join(', ')).split(',').map(t => t.trim()).filter(t => t)
            };

            const res = await api.put(`/projects/${project._id}`, fullPayload, token || undefined);
            setProject(res); // Update local state
            setEditMode(prev => ({ ...prev, [field]: false }));
            if (refreshProjects) refreshProjects();

        } catch (err) {
            console.error("Failed to update", err);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteFile = async (path: string) => {
        const confirmed = await confirmModal(`${t('repo.delete_file.confirm')} ${path}?`, undefined, 'danger');
        if (!confirmed) return;
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            await api.deleteFile(project!._id, path, token);
            setFiles(prev => prev.filter(f => f.path !== path));
        } catch (err) {
            console.error(err);
            await alert(t('repo.delete_file.failed'), undefined, 'danger');
        }
    };

    // File Upload Handlers (existing code...)

    const fileInputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);
    const [pendingFiles, setPendingFiles] = useState<File[]>([]); // For batch upload
    const [currentConflictFile, setCurrentConflictFile] = useState<File | null>(null); // Track current conflict
    const [conflictModalOpen, setConflictModalOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showUploadMenu, setShowUploadMenu] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    const handleDeleteProject = async () => {
        if (!project) return;
        const input = document.getElementById('delete-confirm-input') as HTMLInputElement;
        if (input.value !== `DeleteProject/${project.name}`) return;

        if (!await confirmModal(t('repo.delete_confirm.desc'), undefined, 'danger')) return;

        setUploading(true); // Reusing uploading spinner for delete action
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            await api.deleteProject(project._id, token);
            await alert("Project deleted successfully.", undefined, 'success');
            navigate('/projects');
        } catch (err) {
            console.error(err);
            await alert("Failed to delete project", undefined, 'danger');
        } finally {
            setUploading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            handleUploadFiles([file]);
        }
        e.target.value = '';
    };

    const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleUploadFiles(Array.from(e.target.files));
        }
        e.target.value = '';
    };

    const handleUploadFiles = async (filesToUpload: File[]) => {
        setPendingFiles(filesToUpload);
        processNextFile(filesToUpload, 0);
    };

    const processNextFile = (fileList: File[], index: number) => {
        if (index >= fileList.length) {
            setPendingFiles([]);
            setCurrentConflictFile(null);
            setConflictModalOpen(false);
            return;
        }

        const file = fileList[index];
        const path = (file.webkitRelativePath || file.name);

        if (files.some(f => f.path === path)) {
            setCurrentConflictFile(file);
            setConflictModalOpen(true);
            // Wait for user action via handleConflict
        } else {
            uploadFile(file, path).then(() => {
                processNextFile(fileList, index + 1);
            });
        }
    };

    const uploadFile = async (file: File, path: string) => {
        if (!project) return;
        setUploading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.error("No token found for upload");
                setUploading(false);
                return;
            }
            const reader = new FileReader();

            return new Promise<void>((resolve) => {
                reader.onload = async (e) => {
                    const content = (e.target?.result || '') as string;
                    await api.uploadFiles(project._id, [{
                        path: path,
                        content: content,
                        name: file.name,
                        size: file.size,
                        type: 'file'
                    }], token);

                    // Refresh files list locally optimization? 
                    // Better to just refresh at the very end usually, but for now refreshing every file is safer for conflict check consistency
                    const filesData = await api.getProjectFiles(project._id);
                    setFiles(filesData);
                    resolve();
                };
                reader.readAsText(file);
            });

        } catch (err) {
            console.error("Upload failed", err);
        } finally {
            setUploading(false); // Only falses when ALL done? No, this function sets false. 
            // We need global uploading state. 
            // Actually `setUploading(true)` is called at start of batch. We should only set false at end.
            // Let's refactor `uploadFile` to NOT touch `setUploading(false)` directly. 
            // Instead, `handleUploadFiles` manages it.
        }
    };

    // Refactored upload single used by batch
    const performUpload = async (file: File, path: string) => {
        const token = localStorage.getItem('token');
        if (!token) return; // Fix lint error
        return new Promise<void>((resolve) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const content = e.target?.result as string;
                await api.uploadFiles(project!._id, [{
                    path: path,
                    content: content,
                    name: file.name,
                    size: file.size,
                    type: 'file'
                }], token);
                resolve();
            };
            reader.readAsText(file);
        });
    }

    const handleConflict = async (action: 'replace' | 'keep' | 'cancel') => {
        if (!currentConflictFile) return;

        const file = currentConflictFile;
        const currentIndex = pendingFiles.indexOf(file);

        if (action === 'cancel') {
            // Skip this file or cancel all? Usually cancel batch.
            // Let's just skip this file and continue
            processNextFile(pendingFiles, currentIndex + 1);
        } else if (action === 'replace') {
            const path = (file.webkitRelativePath || file.name);
            await performUpload(file, path);
            processNextFile(pendingFiles, currentIndex + 1);
        } else if (action === 'keep') {
            let name = file.webkitRelativePath || file.name;
            let counter = 2;
            const ext = name.includes('.') ? `.${name.split('.').pop()}` : '';
            const base = name.includes('.') ? name.substring(0, name.lastIndexOf('.')) : name;

            // Check conflict with local 'files' state which is refreshed after every upload
            // Wait, we need to ensure 'files' is up to date.
            // We refresh it after every upload in `performUpload` (let's add that logic back).

            // Simpler: Just refresh files before checking?
            const filesData = await api.getProjectFiles(project!._id);
            setFiles(filesData); // Ensure fresh

            while (filesData.some((f: any) => f.path === name)) {
                name = `${base} (${counter})${ext}`;
                counter++;
            }
            await performUpload(file, name);
            processNextFile(pendingFiles, currentIndex + 1);
        }
    };

    const handleStar = async () => {
        if (!project || !user) return;
        setStarring(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await api.starProject(project._id, token);
            setProject(p => p ? { ...p, stars: res.stars, starredBy: res.starredBy } : null);
            if (refreshProjects) refreshProjects();
        } catch (e) { console.error(e); }
        finally { setStarring(false); }
    };

    const handleDownload = async () => {
        if (!project) return;
        setDownloading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                await alert("Please login to download", undefined, 'info');
                return;
            }

            // Fetch files from server (increments download count too)
            const res = await api.downloadProject(project._id, token);

            if (res.files && res.files.length > 0) {
                const zip = new JSZip();

                // Add files to zip
                res.files.forEach((file: any) => {
                    // Remove leading slash if present to avoid issue with some zip extractors
                    const fileName = file.path.startsWith('/') ? file.path.slice(1) : file.path;
                    zip.file(fileName, file.content);
                });

                // Generate zip blob
                const content = await zip.generateAsync({ type: "blob" });
                saveAs(content, `${project.name}.zip`);

                // Update local download count
                setProject(p => p ? { ...p, downloadCount: res.downloadCount } : null);
            } else {
                await alert(t('repo.download_no_files'), undefined, 'info');
            }

        } catch (e) {
            console.error("Download failed", e);
            await alert("Failed to download project.", undefined, 'danger');
        }
        finally { setDownloading(false); }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
    if (!project) return <div className="text-white text-center mt-20">Project not found</div>;

    const ownerName = typeof project.ownerId === 'object' ? project.ownerId.displayName : t('project.card.unknown_user');
    const isOwnerBanned = typeof project.ownerId === 'object' ? project.ownerId.isBanned : false;

    return (
        <div className="animate-fade-in max-w-6xl mx-auto px-4 py-8">
            <ConflictModal
                isOpen={conflictModalOpen}
                fileName={currentConflictFile?.name || ''}
                onReplace={() => handleConflict('replace')}
                onKeepBoth={() => handleConflict('keep')}
                onCancel={() => handleConflict('cancel')}
            />

            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 group transition-colors">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> {t('repo.back')}
            </button>

            <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
                <div className="flex-1 max-w-3xl">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                        {editMode.name ? (
                            <div className="flex items-center gap-2 w-full max-w-md">
                                <input
                                    value={editValues.name}
                                    onChange={e => setEditValues(prev => ({ ...prev, name: e.target.value }))}
                                    className="bg-black border border-blue-500 rounded px-3 py-1 text-2xl font-bold text-white w-full outline-none"
                                    autoFocus
                                />
                                <button onClick={() => handleSaveField('name')} disabled={saving} className="p-1 bg-green-500/20 text-green-500 rounded hover:bg-green-500/30 disabled:opacity-50"><Save className="w-5 h-5" /></button>
                                <button onClick={() => toggleEdit('name')} className="p-1 bg-red-500/20 text-red-500 rounded hover:bg-red-500/30"><X className="w-5 h-5" /></button>
                            </div>
                        ) : (
                            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3 group">
                                {project.name}
                                {isOwner && <button onClick={() => toggleEdit('name')} className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-blue-400"><Pencil className="w-4 h-4" /></button>}
                            </h1>
                        )}

                        {editMode.visibility ? (
                            <div className="flex items-center gap-2">
                                <CustomSelect
                                    value={editValues.visibility}
                                    onChange={(val) => setEditValues(prev => ({ ...prev, visibility: val }))}
                                    options={[
                                        { value: "public", label: t('repo.visibility.public') },
                                        { value: "private", label: t('repo.visibility.private') }
                                    ]}
                                />
                                <button onClick={() => handleSaveField('visibility')} disabled={saving} className="p-0.5 bg-green-500/20 text-green-500 rounded hover:bg-green-500/30 disabled:opacity-50"><Save className="w-3 h-3" /></button>
                                <button onClick={() => toggleEdit('visibility')} className="p-0.5 bg-red-500/20 text-red-500 rounded hover:bg-red-500/30"><X className="w-3 h-3" /></button>
                            </div>
                        ) : (
                            <div className="group relative flex items-center">
                                <span className={`px-3 py-0.5 rounded-full text-xs font-medium border ${project.visibility === 'public' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                                    {project.visibility === 'public' ? t('repo.visibility.public') : t('repo.visibility.private')}
                                </span>
                                {isOwner && (
                                    <button
                                        onClick={() => toggleEdit('visibility')}
                                        className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-blue-400"
                                        title="Change Visibility"
                                    >
                                        <Pencil className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {editMode.description ? (
                        <div className="w-full max-w-2xl mt-2">
                            <textarea
                                value={editValues.description}
                                onChange={e => setEditValues(prev => ({ ...prev, description: e.target.value }))}
                                className="bg-black border border-blue-500 rounded px-3 py-2 text-zinc-300 w-full outline-none min-h-[100px]"
                            />
                            <div className="flex gap-2 mt-2">
                                <button onClick={() => handleSaveField('description')} disabled={saving} className="px-3 py-1 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-500 disabled:opacity-50">{t('repo.edit.save')}</button>
                                <button onClick={() => toggleEdit('description')} className="px-3 py-1 bg-zinc-700 text-white rounded text-xs hover:bg-zinc-600">{t('repo.edit.cancel')}</button>
                            </div>
                        </div>
                    ) : (
                        <div className="group relative">
                            <p className="text-zinc-400 text-lg leading-relaxed max-w-2xl mt-1 pr-8">
                                {project.description || "No description provided."}
                            </p>
                            {isOwner && <button onClick={() => toggleEdit('description')} className="absolute top-0 right-full md:right-auto md:left-full md:ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-blue-400"><Pencil className="w-4 h-4" /></button>}
                        </div>
                    )}
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <button
                        onClick={() => api.togglePinProject(project._id, localStorage.getItem('token')!).then(res => { setIsPinned(res.includes(project._id)); refreshUser && refreshUser(); })}
                        className="flex-1 md:flex-none justify-center px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-all active:scale-95 disabled:opacity-50"
                    >
                        <PinIcon className={`w-4 h-4 ${isPinned ? 'fill-blue-500 text-blue-500' : 'text-zinc-400'}`} />
                        {isPinned ? t('repo.pinned') : t('repo.pin')}
                    </button>
                    <button
                        onClick={handleStar}
                        disabled={starring}
                        className="flex-1 md:flex-none justify-center px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-all active:scale-95 disabled:opacity-50"
                    >
                        <Star className={`w-4 h-4 ${project.starredBy?.includes(user?._id || user?.id || '') ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                        {t('repo.star')}
                        <span className="bg-black/30 px-2 py-0.5 rounded text-xs ml-1">{project.stars}</span>
                    </button>
                    <button
                        onClick={handleDownload}
                        disabled={downloading}
                        className="flex-1 md:flex-none justify-center px-4 py-2 bg-white text-black hover:bg-gray-200 rounded-lg flex items-center gap-2 text-sm font-bold transition-all shadow-lg shadow-white/5 active:scale-95 disabled:opacity-50"
                    >
                        {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        {t('repo.download')}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* File Browser */}
                    <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl overflow-hidden">
                        <div className="bg-zinc-900/80 px-4 py-3 border-b border-zinc-800 flex justify-between items-center backdrop-blur-sm">
                            <div className="flex items-center gap-2 text-sm font-mono text-zinc-400">
                                <GitCommit className="w-4 h-4" />
                                <span className="text-white">main</span>
                                <span className="mx-2 text-zinc-700">|</span>
                                <button
                                    onClick={() => navigate(`/user/${typeof project.ownerId === 'string' ? project.ownerId : project.ownerId._id}`)}
                                    className="text-white hover:underline cursor-pointer hover:text-blue-400 transition-colors flex items-center gap-1"
                                >
                                    {ownerName}
                                    {isOwnerBanned && <ShieldAlert className="w-3 h-3 text-red-500" />}
                                </button>
                                <span className="text-zinc-600 ml-2 text-xs">{new Date(project.updatedAt).toLocaleDateString()}</span>
                            </div>


                            {isOwner && (
                                <div className="flex items-center gap-2 relative">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                    <input
                                        type="file"
                                        ref={folderInputRef}
                                        onChange={handleFolderSelect}
                                        className="hidden"
                                        {...{ webkitdirectory: "", directory: "" } as any}
                                    />

                                    <div className="relative">
                                        <button
                                            onClick={() => setShowUploadMenu(!showUploadMenu)}
                                            disabled={uploading}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/10 text-blue-400 hover:bg-blue-600/20 border border-blue-500/20 rounded text-xs font-bold transition-all"
                                        >
                                            {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                                            {t('repo.upload')}
                                            <ChevronDown className={`w-3 h-3 transition-transform ${showUploadMenu ? 'rotate-180' : ''}`} />
                                        </button>

                                        {showUploadMenu && (
                                            <>
                                                <div
                                                    className="fixed inset-0 z-10"
                                                    onClick={() => setShowUploadMenu(false)}
                                                />
                                                <div className="absolute right-0 mt-2 w-36 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-20 overflow-hidden animate-fade-in-up">
                                                    <button
                                                        onClick={() => {
                                                            fileInputRef.current?.click();
                                                            setShowUploadMenu(false);
                                                        }}
                                                        className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors"
                                                    >
                                                        <FileCode className="w-4 h-4" /> {t('repo.upload.file')}
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            folderInputRef.current?.click();
                                                            setShowUploadMenu(false);
                                                        }}
                                                        className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors border-t border-zinc-800"
                                                    >
                                                        <Folder className="w-4 h-4" /> {t('repo.upload.folder')}
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="divide-y divide-zinc-800/50">
                            {files.length === 0 ? (
                                <div className="px-4 py-8 text-center text-zinc-500 text-sm">
                                    <Folder className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                    {t('repo.no_files')}
                                </div>
                            ) : (
                                files.map((file, i) => (
                                    <div key={i} className="px-4 py-3 hover:bg-zinc-800/30 flex items-center justify-between text-sm group cursor-pointer transition-colors">
                                        <div className="flex items-center gap-3">
                                            {file.type === 'folder' ?
                                                <Folder className="w-4 h-4 text-blue-400 fill-blue-400/20" /> :
                                                <FileCode className="w-4 h-4 text-zinc-500 group-hover:text-blue-400 transition-colors" />
                                            }
                                            <span className="text-text-muted group-hover:text-blue-400 transition-colors">{file.path}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-zinc-600 text-xs font-mono">{((file.size || 0) / 1024).toFixed(1)} KB</span>
                                            {isOwner && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.path); }}
                                                    className="text-zinc-600 hover:text-red-500 transition-colors p-1"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Readme Section */}
                    {/* ... (Existing Readme code) ... */}
                    <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-8">
                        <h3 className="text-xl font-bold text-white mb-6 border-b border-zinc-800 pb-4 flex items-center gap-2">
                            <FileCode className="w-5 h-5 text-gray-400" /> {t('repo.readme.title')}
                        </h3>
                        <article className="prose prose-invert max-w-none">
                            {readmeContent ? (
                                <ReactMarkdown>{readmeContent}</ReactMarkdown>
                            ) : (
                                <p className="text-zinc-400 italic">{t('repo.readme.placeholder')}</p>
                            )}
                        </article>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
                        {/* About Section - Already editable via inline title/desc above, but tags here? */}
                        {/* ... (Stats) ... */}
                        <h3 className="text-xs font-bold text-zinc-500 mb-4 uppercase tracking-wider">{t('repo.about')}</h3>
                        {/* Reusing description display logic or just Stats */}
                        <div className="space-y-4 text-sm">
                            <div className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors">
                                <ExternalLink className="w-4 h-4" /> <span className="truncate">{t('repo.no_website')}</span>
                            </div>
                            <div className="flex items-center gap-3 text-zinc-400">
                                <Star className="w-4 h-4" /> {project.stars} stars
                            </div>
                            <div className="flex items-center gap-3 text-zinc-400">
                                <Download className="w-4 h-4" /> {project.downloadCount} downloads
                            </div>
                            <div className="flex items-center gap-3 text-zinc-400">
                                <Clock className="w-4 h-4" /> {t('repo.created')} {new Date(project.createdAt).toLocaleDateString()}
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-zinc-800">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('repo.tags')}</h4>
                                {isOwner && <button onClick={() => toggleEdit('tags')} className="text-zinc-500 hover:text-blue-400"><Pencil className="w-3 h-3" /></button>}
                            </div>

                            {editMode.tags ? (
                                <div>
                                    <input
                                        value={editValues.tags}
                                        onChange={e => setEditValues(prev => ({ ...prev, tags: e.target.value }))}
                                        className="w-full bg-black border border-blue-500 rounded px-2 py-1 text-sm text-white outline-none mb-2"
                                        placeholder="React, Node, etc."
                                        autoFocus
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={() => handleSaveField('tags')} disabled={saving} className="px-2 py-1 bg-green-600 text-white rounded text-xs disabled:opacity-50">{t('repo.edit.save')}</button>
                                        <button onClick={() => toggleEdit('tags')} className="px-2 py-1 bg-zinc-700 text-white rounded text-xs">{t('repo.edit.cancel')}</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {project.tags && project.tags.length > 0 ? project.tags.map(tag => (
                                        <span key={tag} className="bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded text-xs font-medium border border-blue-500/20 hover:bg-blue-500/20 transition-colors cursor-default">
                                            {tag}
                                        </span>
                                    )) : <span className="text-zinc-600 text-xs italic">{t('repo.tags.no_tags')}</span>}
                                </div>
                            )}
                        </div>
                    </div>

                    {isOwner && (
                        <div className="bg-red-900/10 border border-red-900/30 rounded-xl p-5">
                            <h3 className="text-xs font-bold text-red-500 mb-4 uppercase tracking-wider">{t('repo.danger_zone')}</h3>
                            <button
                                onClick={() => setDeleteModalOpen(true)}
                                className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" /> {t('repo.delete_project')}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && project && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex items-center gap-3 text-red-500 mb-4">
                            <AlertTriangle className="w-6 h-6" />
                            <h3 className="text-lg font-bold text-white">{t('repo.delete_confirm.title')}</h3>
                        </div>
                        <p className="text-text-muted mb-4 text-sm">
                            {t('repo.delete_confirm.desc')}
                        </p>
                        <p className="text-zinc-400 mb-4 text-xs">
                            {t('repo.delete_confirm.type')} <span className="font-mono text-red-400 bg-red-900/20 px-1 rounded select-all">DeleteProject/{project.name}</span>
                        </p>

                        <input
                            type="text"
                            className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white mb-4 text-sm font-mono focus:border-red-500 outline-none transition-colors"
                            placeholder={`DeleteProject/${project.name}`}
                            onChange={(e) => {
                                if (e.target.value === `DeleteProject/${project.name}`) {
                                    e.target.classList.add('border-green-500');
                                    e.target.classList.remove('border-zinc-700');
                                } else {
                                    e.target.classList.remove('border-green-500');
                                    e.target.classList.add('border-zinc-700');
                                }
                                // We'll just check input value in the button disabled state or a ref/state
                                // But simple way is local state for input
                            }}
                            id="delete-confirm-input"
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={handleDeleteProject}
                                disabled={uploading} // reuse uploading loading state or separate one
                                className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold text-sm transition-colors"
                                onMouseEnter={(e) => {
                                    // Quick check before click
                                    const input = document.getElementById('delete-confirm-input') as HTMLInputElement;
                                    if (input.value !== `DeleteProject/${project.name}`) e.currentTarget.disabled = true;
                                    else e.currentTarget.disabled = false;
                                }}
                            >
                                {uploading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t('repo.delete_confirm.button')}
                            </button>
                            <button
                                onClick={() => setDeleteModalOpen(false)}
                                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium text-sm transition-colors"
                            >
                                {t('repo.delete_confirm.cancel')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default RepoDetail;
