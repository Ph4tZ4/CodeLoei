import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Upload, FileCode, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';
import { useAlert } from '../contexts/AlertContext';

const SetupProject = () => {
    const { t } = useLanguage();
    const { alert } = useAlert();
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Mock initial file for simple setup
    const handleQuickSetup = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token || !id) return;

        try {
            const files = [
                {
                    path: 'README.md',
                    name: 'README.md',
                    content: '# Project Setup\n\nThis project was initialized via quick setup.',
                    type: 'file'
                },
                {
                    path: 'src/App.js',
                    name: 'App.js',
                    content: 'console.log("Hello World");',
                    type: 'file'
                }
            ];

            await api.uploadFiles(id, files, token);
            navigate(`/projects/${id}`);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const [uploading, setUploading] = useState(false);

    const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const fileList = e.target.files;
        if (!fileList || fileList.length === 0 || !id) return;

        setUploading(true);
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const filesToUpload: any[] = [];

            // Read all files
            const promises = Array.from(fileList).map(file => {
                return new Promise<void>((resolve) => {
                    // Skip hidden files or node_modules for basic sanity
                    if (file.name.startsWith('.') || file.webkitRelativePath.includes('node_modules') || file.webkitRelativePath.includes('.git')) {
                        resolve();
                        return;
                    }

                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        const content = ev.target?.result;
                        // Very basic binary check (can be improved)
                        if (typeof content === 'string') {
                            filesToUpload.push({
                                path: file.webkitRelativePath || file.name, // Fallback to name if relative path is empty (root file)
                                name: file.name,
                                content: content,
                                type: 'file',
                                size: file.size
                            });
                        }
                        resolve();
                    };
                    // Read as text for source code. For images we might need readAsDataURL and handle differently in backend
                    // For now assuming source code text files.
                    reader.readAsText(file);
                });
            });

            await Promise.all(promises);

            if (filesToUpload.length > 0) {
                await api.uploadFiles(id, filesToUpload, token);
                navigate(`/projects/${id}`);
            } else {
                await alert(t('setup.upload.no_valid'), undefined, 'warning');
            }

        } catch (err) {
            console.error("Upload failed", err);
            await alert(t('repo.upload.failed'), undefined, 'danger');
        } finally {
            setUploading(false);
            // Reset input
            e.target.value = '';
        }
    };

    return (
        <div className="animate-fade-in max-w-4xl mx-auto py-12 px-4">
            <h1 className="text-3xl font-bold text-white mb-6">{t('setup.title')}</h1>
            <p className="text-zinc-400 mb-12">{t('setup.subtitle')}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div onClick={handleQuickSetup} className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl hover:bg-zinc-900/80 hover:border-blue-500/50 cursor-pointer transition-all group">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition-transform">
                        {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <FileCode className="w-6 h-6" />}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{t('setup.quick.title')}</h3>
                    <p className="text-sm text-zinc-500 mb-4">{t('setup.quick.desc')}</p>
                    <span className="text-blue-400 text-sm font-medium flex items-center gap-1">{t('setup.quick.action')} <ArrowRight className="w-3 h-3" /></span>
                </div>

                <div onClick={() => document.getElementById('folderInput')?.click()} className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl hover:bg-zinc-900/80 hover:border-blue-500/50 cursor-pointer transition-all group relative">
                    <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-500 mb-6 group-hover:text-blue-400 group-hover:bg-blue-500/10 transition-colors">
                        {uploading ? <Loader2 className="w-6 h-6 animate-spin text-blue-500" /> : <Upload className="w-6 h-6" />}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{t('setup.upload.title')}</h3>
                    <p className="text-sm text-zinc-500 mb-4">{t('setup.upload.desc')}</p>
                    <span className="text-blue-400 text-sm font-medium flex items-center gap-1">{t('setup.upload.action')} <ArrowRight className="w-3 h-3" /></span>

                    {/* Hidden Input */}
                    <input
                        type="file"
                        id="folderInput"
                        className="hidden"
                        // @ts-ignore
                        webkitdirectory=""
                        directory=""
                        multiple
                        onChange={handleFolderUpload}
                    />
                </div>
            </div>

            <div className="mt-12 text-center">
                <button onClick={() => navigate(`/projects/${id}`)} className="text-zinc-500 hover:text-white text-sm">{t('setup.skip')}</button>
            </div>
        </div>
    );
};

export default SetupProject;
