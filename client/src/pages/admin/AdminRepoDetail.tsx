import { ArrowLeft, GitCommit, FileCode, Folder, Download, Star, ExternalLink, Clock, Loader2, Pencil, Trash2, Upload, X, Save, AlertTriangle, ChevronDown } from 'lucide-react';
import { useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { api } from '../../lib/api';
import CustomSelect from '../../components/CustomSelect';
import { useAlert } from '../../contexts/AlertContext';
import type { Project, FileNode } from '../../types';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import ReactMarkdown from 'react-markdown';

// Conflict Modal Component (Inline for simplicity)
interface ConflictModalProps {
    isOpen: boolean;
    fileName: string;
    onReplace: () => void;
    onKeepBoth: () => void;
    onCancel: () => void;
}

const ConflictModal = ({ isOpen, fileName, onReplace, onKeepBoth, onCancel }: ConflictModalProps) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-md w-full shadow-2xl animate-fade-in">
                <div className="flex items-center gap-3 text-yellow-500 mb-4">
                    <AlertTriangle className="w-6 h-6" />
                    <h3 className="text-lg font-bold text-white">File Conflict</h3>
                </div>
                <p className="text-zinc-300 mb-6">
                    A file named <span className="text-white font-mono font-bold">{fileName}</span> already exists.
                    What would you like to do?
                </p>
                <div className="flex flex-col gap-3">
                    <button onClick={onReplace} className="w-full py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 font-medium transition-colors">
                        Replace existing file
                    </button>
                    <button onClick={onKeepBoth} className="w-full py-2.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg hover:bg-blue-500/20 font-medium transition-colors">
                        Keep both (rename new file)
                    </button>
                    <button onClick={onCancel} className="w-full py-2.5 bg-zinc-800 text-zinc-400 border border-zinc-700 rounded-lg hover:bg-zinc-700 font-medium transition-colors">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

// ...
const AdminRepoDetail = () => {
    const { alert, confirm } = useAlert();
    const navigate = useNavigate();
    const { id } = useParams();
    const [project, setProject] = useState<Project | null>(null);
    const [files, setFiles] = useState<FileNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [readmeContent, setReadmeContent] = useState<string | null>(null);

    // Edit States
    const [editMode, setEditMode] = useState<{ [key: string]: boolean }>({});
    const [editValues, setEditValues] = useState<{ [key: string]: string }>({});


    // File Upload States
    const fileInputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const [currentConflictFile, setCurrentConflictFile] = useState<File | null>(null);
    const [conflictModalOpen, setConflictModalOpen] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showUploadMenu, setShowUploadMenu] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    // Context
    const context = useOutletContext<any>() || {};
    const { refreshProjects } = context;

    useEffect(() => {
        const fetchProjectData = async () => {
            if (!id) return;
            try {
                const token = localStorage.getItem('token') || localStorage.getItem('adminToken');

                // Parallelize fetching
                const projectPromise = api.get(`/projects/${id}`, token || undefined);
                const filesPromise = api.getProjectFiles(id);

                const [projData, filesData] = await Promise.all([projectPromise, filesPromise]);

                setProject(projData);
                setEditValues({
                    name: projData.name,
                    description: projData.description || '',
                    tags: projData.tags ? projData.tags.join(', ') : '',
                    visibility: projData.visibility
                });

                // Removed pin logic for admin

                setFiles(filesData);

                const readme = filesData.find((f: any) => f.name.toLowerCase() === 'readme.md');
                if (readme) {
                    try {
                        const fileData = await api.getFileContent(id, readme.path);
                        setReadmeContent(fileData.content);
                    } catch (err) { console.error(err); }
                }

                // Skip logging project view for admin or handle differently
            } catch (err) {
                console.error("Failed to fetch project data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProjectData();
    }, [id]);

    // Admin is always "owner" in terms of permissions here
    // const isOwner = true; // Unused variable if we just hardcode permissions in UI check or remove checks.
    // Actually, I should check if I used `isOwner` anywhere. I likely did in the copy-pasted code.
    // If I used it, I should keep it but disable the lint warning or use it.
    // Let's keep it but suppress lint or ensure usage.
    // Actually, let's look at the usage in the copy-paste.
    // The previous Tool Output showed: "{isOwner && ...}" many times.
    // So `isOwner` IS used. Why did lint say otherwise? 
    // "isOwner is declared but its value is never read" - maybe I am mistaken or it's a false positive or I missed where it was utilized in the huge block.
    // Let's keeping it for now but remove `refreshUser`.

    const toggleEdit = (field: string) => {
        setEditMode(prev => ({ ...prev, [field]: !prev[field] }));
        if (!editMode[field] && project) {
            setEditValues(prev => ({
                ...prev,
                name: project.name,
                description: project.description || '',
                tags: project.tags ? project.tags.join(', ') : '',
                visibility: project.visibility
            }));
        }
    };

    const handleSaveField = async (field: string) => {
        if (!project) return;

        try {
            const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
            const fullPayload = {
                name: field === 'name' ? editValues.name : project.name,
                description: field === 'description' ? editValues.description : project.description,
                language: project.language,
                visibility: field === 'visibility' ? editValues.visibility : project.visibility,
                license: project.license,
                tags: (field === 'tags' ? editValues.tags : (project.tags || []).join(', ')).split(',').map((t: string) => t.trim()).filter((t: string) => t.length > 0)
            };

            const res = await api.put(`/projects/${project._id}`, fullPayload, token || undefined);
            setProject(res);
            setEditMode(prev => ({ ...prev, [field]: false }));
            if (refreshProjects) refreshProjects();

        } catch (err) {
            console.error("Failed to update", err);
            await alert("Update failed. Ensure you have permissions.", undefined, 'danger');
        }
    };

    const handleDeleteFile = async (path: string) => {
        if (!await confirm(`Are you sure you want to delete ${path}?`, undefined, 'danger')) return;
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
            if (!token) return;
            await api.deleteFile(project!._id, path, token);
            setFiles(prev => prev.filter(f => f.path !== path));
        } catch (err) {
            console.error(err);
            await alert("Failed to delete file.", undefined, 'danger');
        }
    };

    const handleDeleteProject = async () => {
        if (!project) return;
        const input = document.getElementById('delete-confirm-input') as HTMLInputElement;
        if (input.value !== `DeleteProject/${project.name}`) return;

        if (!await confirm("Final warning: Delete this project?", undefined, 'danger')) return;

        setUploading(true);
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
            if (!token) return;

            await api.deleteProject(project._id, token);
            await alert("Project deleted successfully.", undefined, 'success');
            navigate('/admin/projects'); // Redirect to admin projects list
        } catch (err) {
            console.error(err);
            await alert("Failed to delete project", undefined, 'danger');
        } finally {
            setUploading(false);
        }
    };

    const performUpload = async (file: File, path: string) => {
        const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
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
                }], token!);
                resolve();
            };
            reader.readAsText(file);
        });
    }

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
        } else {
            performUpload(file, path).then(() => {
                processNextFile(fileList, index + 1);
            });
        }
    };

    const handleUploadFiles = async (filesToUpload: File[]) => {
        setPendingFiles(filesToUpload);
        processNextFile(filesToUpload, 0);
    };

    const handleConflict = async (action: 'replace' | 'keep' | 'cancel') => {
        if (!currentConflictFile) return;

        const file = currentConflictFile;
        const currentIndex = pendingFiles.indexOf(file);

        if (action === 'cancel') {
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

            const filesData = await api.getProjectFiles(project!._id);
            setFiles(filesData);

            while (filesData.some((f: any) => f.path === name)) {
                name = `${base} (${counter})${ext}`;
                counter++;
            }
            await performUpload(file, name);
            processNextFile(pendingFiles, currentIndex + 1);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleUploadFiles([e.target.files[0]]);
        }
        e.target.value = '';
    };

    const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleUploadFiles(Array.from(e.target.files));
        }
        e.target.value = '';
    };

    const handleDownload = async () => {
        if (!project) return;
        setDownloading(true);
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
            if (!token) return;

            const res = await api.downloadProject(project._id, token);

            if (res.files && res.files.length > 0) {
                const zip = new JSZip();
                res.files.forEach((file: any) => {
                    const fileName = file.path.startsWith('/') ? file.path.slice(1) : file.path;
                    zip.file(fileName, file.content);
                });
                const content = await zip.generateAsync({ type: "blob" });
                saveAs(content, `${project.name}.zip`);
                setProject(p => p ? { ...p, downloadCount: res.downloadCount } : null);
            } else {
                await alert("No files to download.", undefined, 'warning');
            }
        } catch (e) {
            console.error("Download failed", e);
            await alert("Failed to download project.", undefined, 'danger');
        }
        finally { setDownloading(false); }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
    if (!project) return <div className="text-white text-center mt-20">Project not found</div>;

    const ownerName = typeof project.ownerId === 'object' ? project.ownerId.displayName : 'Unknown';

    return (
        <div className="animate-fade-in max-w-6xl mx-auto px-4 py-8">
            <ConflictModal
                isOpen={conflictModalOpen}
                fileName={currentConflictFile?.name || ''}
                onReplace={() => handleConflict('replace')}
                onKeepBoth={() => handleConflict('keep')}
                onCancel={() => handleConflict('cancel')}
            />

            {/* Admin Banner */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-400 text-sm font-medium">
                    <Pencil className="w-4 h-4" />
                    You are viewing this project in Admin Mode. You have full edit access.
                </div>
            </div>

            <button onClick={() => navigate('/admin/projects')} className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 group transition-colors">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> กลับไปหน้าจัดการโครงการ
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
                                <button onClick={() => handleSaveField('name')} className="p-1 bg-green-500/20 text-green-500 rounded hover:bg-green-500/30"><Save className="w-5 h-5" /></button>
                                <button onClick={() => toggleEdit('name')} className="p-1 bg-red-500/20 text-red-500 rounded hover:bg-red-500/30"><X className="w-5 h-5" /></button>
                            </div>
                        ) : (
                            <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3 group">
                                {project.name}
                                <button onClick={() => toggleEdit('name')} className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-blue-400"><Pencil className="w-4 h-4" /></button>
                            </h1>
                        )}

                        {editMode.visibility ? (
                            <div className="flex items-center gap-2">
                                <CustomSelect
                                    value={editValues.visibility}
                                    onChange={(val) => setEditValues(prev => ({ ...prev, visibility: val }))}
                                    options={[
                                        { value: "public", label: "Public" },
                                        { value: "private", label: "Private" }
                                    ]}
                                    className="w-full"
                                />
                                <button onClick={() => handleSaveField('visibility')} className="p-0.5 bg-green-500/20 text-green-500 rounded hover:bg-green-500/30"><Save className="w-3 h-3" /></button>
                                <button onClick={() => toggleEdit('visibility')} className="p-0.5 bg-red-500/20 text-red-500 rounded hover:bg-red-500/30"><X className="w-3 h-3" /></button>
                            </div>
                        ) : (
                            <div className="group relative flex items-center">
                                <span className={`px-3 py-0.5 rounded-full text-xs font-medium border ${project.visibility === 'public' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                                    {project.visibility === 'public' ? 'Public' : 'Private'}
                                </span>
                                <button
                                    onClick={() => toggleEdit('visibility')}
                                    className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-blue-400"
                                    title="Change Visibility"
                                >
                                    <Pencil className="w-3 h-3" />
                                </button>
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
                                <button onClick={() => handleSaveField('description')} className="px-3 py-1 bg-green-600 text-white rounded text-xs font-bold hover:bg-green-500">Save</button>
                                <button onClick={() => toggleEdit('description')} className="px-3 py-1 bg-zinc-700 text-white rounded text-xs hover:bg-zinc-600">Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <div className="group relative">
                            <p className="text-zinc-400 text-lg leading-relaxed max-w-2xl mt-1 pr-8">
                                {project.description || "No description provided."}
                            </p>
                            <button onClick={() => toggleEdit('description')} className="absolute top-0 right-full md:right-auto md:left-full md:ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-zinc-500 hover:text-blue-400"><Pencil className="w-4 h-4" /></button>
                        </div>
                    )}
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <button
                        onClick={handleDownload}
                        disabled={downloading}
                        className="flex-1 md:flex-none justify-center px-4 py-2 bg-white text-black hover:bg-gray-200 rounded-lg flex items-center gap-2 text-sm font-bold transition-all shadow-lg shadow-white/5 active:scale-95 disabled:opacity-50"
                    >
                        {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Download
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
                                <span className="text-white">{ownerName}</span>
                                <span className="text-zinc-600 ml-2 text-xs">{new Date(project.updatedAt).toLocaleDateString()}</span>
                            </div>


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
                                        Upload
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
                                                    <FileCode className="w-4 h-4" /> File
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        folderInputRef.current?.click();
                                                        setShowUploadMenu(false);
                                                    }}
                                                    className="w-full px-4 py-2 text-left text-sm text-zinc-300 hover:bg-white/5 hover:text-white flex items-center gap-2 transition-colors border-t border-zinc-800"
                                                >
                                                    <Folder className="w-4 h-4" /> Folder
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="divide-y divide-zinc-800/50">
                            {files.length === 0 ? (
                                <div className="px-4 py-8 text-center text-zinc-500 text-sm">
                                    <Folder className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                    No files uploaded yet.
                                </div>
                            ) : (
                                files.map((file, i) => (
                                    <div key={i} className="px-4 py-3 hover:bg-zinc-800/30 flex items-center justify-between text-sm group cursor-pointer transition-colors">
                                        <div className="flex items-center gap-3">
                                            {file.type === 'folder' ?
                                                <Folder className="w-4 h-4 text-blue-400 fill-blue-400/20" /> :
                                                <FileCode className="w-4 h-4 text-zinc-500 group-hover:text-blue-400 transition-colors" />
                                            }
                                            <span className="text-gray-300 group-hover:text-blue-400 transition-colors">{file.path}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-zinc-600 text-xs font-mono">{((file.size || 0) / 1024).toFixed(1)} KB</span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.path); }}
                                                className="text-zinc-600 hover:text-red-500 transition-colors p-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Readme Section */}
                    <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-8">
                        <h3 className="text-xl font-bold text-white mb-6 border-b border-zinc-800 pb-4 flex items-center gap-2">
                            <FileCode className="w-5 h-5 text-gray-400" /> README.md
                        </h3>
                        <article className="prose prose-invert max-w-none">
                            {readmeContent ? (
                                <ReactMarkdown>{readmeContent}</ReactMarkdown>
                            ) : (
                                <p className="text-zinc-400 italic">README content would be rendered here.</p>
                            )}
                        </article>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
                        <h3 className="text-xs font-bold text-zinc-500 mb-4 uppercase tracking-wider">About</h3>
                        <div className="space-y-4 text-sm">
                            <div className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors">
                                <ExternalLink className="w-4 h-4" /> <span className="truncate">No website</span>
                            </div>
                            <div className="flex items-center gap-3 text-zinc-400">
                                <Star className="w-4 h-4" /> {project.stars} stars
                            </div>
                            <div className="flex items-center gap-3 text-zinc-400">
                                <Download className="w-4 h-4" /> {project.downloadCount} downloads
                            </div>
                            <div className="flex items-center gap-3 text-zinc-400">
                                <Clock className="w-4 h-4" /> Created {new Date(project.createdAt).toLocaleDateString()}
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-zinc-800">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Tags</h4>
                                <button onClick={() => toggleEdit('tags')} className="text-zinc-500 hover:text-blue-400"><Pencil className="w-3 h-3" /></button>
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
                                        <button onClick={() => handleSaveField('tags')} className="px-2 py-1 bg-green-600 text-white rounded text-xs">Save</button>
                                        <button onClick={() => toggleEdit('tags')} className="px-2 py-1 bg-zinc-700 text-white rounded text-xs">Cancel</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {project.tags && project.tags.length > 0 ? project.tags.map(tag => (
                                        <span key={tag} className="bg-blue-500/10 text-blue-400 px-2.5 py-1 rounded text-xs font-medium border border-blue-500/20 hover:bg-blue-500/20 transition-colors cursor-default">
                                            {tag}
                                        </span>
                                    )) : <span className="text-zinc-600 text-xs italic">No tags</span>}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-red-900/10 border border-red-900/30 rounded-xl p-5">
                        <h3 className="text-xs font-bold text-red-500 mb-4 uppercase tracking-wider">Danger Zone</h3>
                        <button
                            onClick={() => setDeleteModalOpen(true)}
                            className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" /> Delete Project
                        </button>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && project && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex items-center gap-3 text-red-500 mb-4">
                            <AlertTriangle className="w-6 h-6" />
                            <h3 className="text-lg font-bold text-white">Delete Project</h3>
                        </div>
                        <p className="text-zinc-300 mb-4 text-sm">
                            This action cannot be undone. This will permanently delete the
                            <span className="text-white font-bold mx-1">{project.name}</span>
                            project, its files, and remove all collaborator associations.
                        </p>
                        <p className="text-zinc-400 mb-4 text-xs">
                            Please type <span className="font-mono text-red-400 bg-red-900/20 px-1 rounded select-all">DeleteProject/{project.name}</span> to confirm.
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
                            }}
                            id="delete-confirm-input"
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={handleDeleteProject}
                                disabled={uploading}
                                className="flex-1 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-bold text-sm transition-colors"
                                onMouseEnter={(e) => {
                                    const input = document.getElementById('delete-confirm-input') as HTMLInputElement;
                                    if (input.value !== `DeleteProject/${project.name}`) e.currentTarget.disabled = true;
                                    else e.currentTarget.disabled = false;
                                }}
                            >
                                {uploading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "I understand, delete this project"}
                            </button>
                            <button
                                onClick={() => setDeleteModalOpen(false)}
                                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium text-sm transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default AdminRepoDetail;
