import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { User, Lock, Bell, Loader2, Camera, Upload, Trash2, X, Globe, Moon, Sun } from 'lucide-react';
import { api } from '../lib/api';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../lib/cropImage';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAlert } from '../contexts/AlertContext';

const Settings = () => {
    const { refreshUser } = useOutletContext<any>();
    const { t, language, setLanguage } = useLanguage();
    const { theme, setTheme } = useTheme();
    const { alert } = useAlert();
    const [activeTab, setActiveTab] = useState('profile');
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form State
    const [showPhotoMenu, setShowPhotoMenu] = useState(false);
    const [formData, setFormData] = useState({
        displayName: '',
        bio: '',
        location: '',
        website: '',
        publicEmail: '',
        skills: '',
        photoURL: ''
    });

    // Cropper State
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const userData = await api.get('/auth/me', token);
                setUser(userData);
                setFormData({
                    displayName: userData.displayName || '',
                    bio: userData.bio || '',
                    location: userData.location || '',
                    website: userData.website || '',
                    publicEmail: userData.publicEmail || '',
                    skills: userData.skills ? userData.skills.join(', ') : '',
                    photoURL: userData.photoURL || ''
                });
            } catch (err) {
                console.error("Failed to load user settings", err);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, []);

    const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const showCroppedImage = useCallback(async () => {
        try {
            if (!imageSrc || !croppedAreaPixels) return;
            const croppedImage = await getCroppedImg(
                imageSrc,
                croppedAreaPixels
            );
            setFormData(prev => ({ ...prev, photoURL: croppedImage }));
            setImageSrc(null); // Close modal
            // Reset zoom/crop
            setZoom(1);
            setCrop({ x: 0, y: 0 });
        } catch (e) {
            console.error(e);
            await alert('Failed to crop image', undefined, 'danger');
        }
    }, [imageSrc, croppedAreaPixels]);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) {
                await alert("File size too large. Please use an image under 5MB.", undefined, 'warning');
                return;
            }
            const reader = new FileReader();
            reader.addEventListener('load', () => setImageSrc(reader.result as string));
            reader.readAsDataURL(file);
            // Verify if we need to clean up input val to allow re-selecting same file
            e.target.value = '';
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            await api.updateProfile(formData, token);
            if (refreshUser) await refreshUser();
            await alert("Updated successfully!", undefined, 'success');
            setUser({ ...user, ...formData });
        } catch (err) {
            console.error("Update failed", err);
            await alert("Failed to update profile", undefined, 'danger');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Loading settings...</div>;

    return (
        <div className="animate-fade-in max-w-4xl mx-auto relative">
            {/* Cropper Modal */}
            {imageSrc && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-4 border-b border-zinc-800">
                            <h3 className="text-white font-bold">{t('settings.profile.crop_title')}</h3>
                            <button onClick={() => setImageSrc(null)} className="text-zinc-400 hover:text-white transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="relative w-full h-[400px] bg-black">
                            <Cropper
                                image={imageSrc}
                                crop={crop}
                                zoom={zoom}
                                aspect={1}
                                onCropChange={setCrop}
                                onCropComplete={onCropComplete}
                                onZoomChange={setZoom}
                            />
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="flex items-center gap-4">
                                <span className="text-zinc-400 text-sm font-medium">{t('settings.profile.zoom')}</span>
                                <input
                                    type="range"
                                    value={zoom}
                                    min={1}
                                    max={3}
                                    step={0.1}
                                    aria-labelledby="Zoom"
                                    onChange={(e) => setZoom(Number(e.target.value))}
                                    className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setImageSrc(null)}
                                    className="px-4 py-2 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors font-medium text-sm"
                                >
                                    {t('settings.profile.cancel')}
                                </button>
                                <button
                                    onClick={showCroppedImage}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium text-sm"
                                >
                                    {t('settings.profile.save_photo')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <h1 className="text-2xl font-bold text-white mb-6">{t('settings.title')}</h1>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="space-y-1">
                    <button
                        onClick={() => setActiveTab('profile')}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'profile' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}
                    >
                        <User className="w-4 h-4" /> {t('settings.tab.profile')}
                    </button>
                    <button
                        onClick={() => setActiveTab('account')}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'account' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}
                    >
                        <Lock className="w-4 h-4" /> {t('settings.tab.account')}
                    </button>
                    <button
                        onClick={() => setActiveTab('notifications')}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'notifications' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}
                    >
                        <Bell className="w-4 h-4" /> {t('settings.tab.notifications')}
                    </button>
                    <button
                        onClick={() => setActiveTab('system')}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'system' ? 'bg-white text-black' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}
                    >
                        <Globe className="w-4 h-4" /> {t('settings.tab.system')}
                    </button>
                </div>

                <div className="md:col-span-3 bg-zinc-900/30 border border-zinc-800 rounded-xl p-6 md:p-8 min-h-[400px]">
                    {activeTab === 'profile' && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-lg font-bold text-white">{t('settings.profile.title')}</h2>

                            <div className="flex items-center gap-6 mb-8">
                                <div className="relative group">
                                    <div className="w-24 h-24 rounded-full bg-zinc-800 flex items-center justify-center text-3xl font-bold text-white overflow-hidden border-2 border-zinc-700 group-hover:border-blue-500 transition-colors">
                                        {formData.photoURL ? (
                                            <img src={formData.photoURL} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            user?.displayName?.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    {formData.photoURL ? (
                                        <>
                                            <button
                                                onClick={() => setShowPhotoMenu(!showPhotoMenu)}
                                                className="absolute bottom-0 right-0 p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full cursor-pointer shadow-lg transition-colors border-none"
                                            >
                                                <Camera className="w-4 h-4" />
                                            </button>

                                            {showPhotoMenu && (
                                                <div className="absolute top-28 right-0 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-50 w-48 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                    <label className="flex items-center gap-2 px-4 py-3 hover:bg-zinc-700/50 cursor-pointer text-sm text-zinc-200 hover:text-white transition-colors">
                                                        <Upload className="w-4 h-4" />
                                                        {t('settings.profile.upload_new')}
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={(e) => {
                                                                handleImageChange(e);
                                                                setShowPhotoMenu(false);
                                                            }}
                                                        />
                                                    </label>
                                                    <button
                                                        onClick={() => {
                                                            setFormData({ ...formData, photoURL: '' });
                                                            setShowPhotoMenu(false);
                                                        }}
                                                        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-red-500/10 text-red-400 hover:text-red-300 text-sm transition-colors text-left"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        {t('settings.profile.remove_photo')}
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <label className="absolute bottom-0 right-0 p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full cursor-pointer shadow-lg transition-colors">
                                            <Camera className="w-4 h-4" />
                                            <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                        </label>
                                    )}
                                </div>

                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">{t('settings.profile.display_name')}</label>
                                    <input
                                        type="text"
                                        className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:border-blue-500 outline-none transition-colors"
                                        value={formData.displayName}
                                        onChange={e => setFormData({ ...formData, displayName: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">{t('settings.profile.email_private')}</label>
                                    <input type="email" className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-500 cursor-not-allowed" value={user?.email || ''} disabled />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">{t('settings.profile.location')}</label>
                                    <input
                                        type="text"
                                        className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:border-blue-500 outline-none transition-colors"
                                        value={formData.location}
                                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                                        placeholder="City, Country"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">{t('settings.profile.website')}</label>
                                    <input
                                        type="text"
                                        className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:border-blue-500 outline-none transition-colors"
                                        value={formData.website}
                                        onChange={e => setFormData({ ...formData, website: e.target.value })}
                                        placeholder="https://example.com"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">{t('settings.profile.public_email')}</label>
                                    <input
                                        type="email"
                                        className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:border-blue-500 outline-none transition-colors"
                                        value={formData.publicEmail}
                                        onChange={e => setFormData({ ...formData, publicEmail: e.target.value })}
                                        placeholder="contact@example.com"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">{t('settings.profile.skills')}</label>
                                    <input
                                        type="text"
                                        className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:border-blue-500 outline-none transition-colors"
                                        value={formData.skills}
                                        onChange={e => setFormData({ ...formData, skills: e.target.value })}
                                        placeholder="React, Node.js, Design"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">{t('settings.profile.bio')}</label>
                                    <textarea
                                        className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-white focus:border-blue-500 outline-none transition-colors h-24"
                                        placeholder={t('settings.profile.bio_placeholder')}
                                        value={formData.bio}
                                        onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                    ></textarea>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-zinc-800 flex justify-end">
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-absolute-white font-medium rounded-lg transition-colors flex items-center gap-2"
                                >
                                    {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {t('settings.profile.save_btn')}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'account' && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-lg font-bold text-white">{t('settings.account.title')}</h2>
                            <div className="text-zinc-500 text-sm">
                                {t('settings.account.desc')}
                            </div>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-lg font-bold text-white">{t('settings.notifications.title')}</h2>
                            <div className="space-y-4">
                                {[t('settings.notifications.star'), t('settings.notifications.fork'), t('settings.notifications.news')].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between py-2">
                                        <span className="text-zinc-300 text-sm">{item}</span>
                                        <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                                            <input type="checkbox" name="toggle" id={`toggle-${i}`} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer translate-x-5" defaultChecked />
                                            <label htmlFor={`toggle-${i}`} className="toggle-label block overflow-hidden h-5 rounded-full bg-green-500 cursor-pointer"></label>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'system' && (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-lg font-bold text-white">{t('settings.tab.system')}</h2>

                            {/* Language Settings */}
                            <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-zinc-800">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-blue-500/10 rounded-lg">
                                        <Globe className="w-6 h-6 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">{t('settings.system.language')}</p>
                                        <p className="text-xs text-zinc-500">{t('settings.system.language_desc')}</p>
                                    </div>
                                </div>
                                <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
                                    <button
                                        onClick={() => setLanguage('th')}
                                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${language === 'th' ? 'bg-zinc-700 text-absolute-white shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
                                    >
                                        ไทย
                                    </button>
                                    <button
                                        onClick={() => setLanguage('en')}
                                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${language === 'en' ? 'bg-zinc-700 text-absolute-white shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
                                    >
                                        English
                                    </button>
                                </div>
                            </div>

                            {/* Theme Settings */}
                            <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-zinc-800">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-purple-500/10 rounded-lg">
                                        {theme === 'dark' ? <Moon className="w-6 h-6 text-purple-500" /> : <Sun className="w-6 h-6 text-amber-500" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">{t('settings.system.theme')}</p>
                                        <p className="text-xs text-zinc-500">{t('settings.system.theme_desc')}</p>
                                    </div>
                                </div>
                                <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
                                    <button
                                        onClick={() => setTheme('light')}
                                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${theme === 'light' ? 'bg-zinc-700 text-absolute-white shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
                                    >
                                        <Sun className="w-4 h-4" /> Light
                                    </button>
                                    <button
                                        onClick={() => setTheme('dark')}
                                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${theme === 'dark' ? 'bg-zinc-700 text-absolute-white shadow-sm' : 'text-text-muted hover:text-text-primary'}`}
                                    >
                                        <Moon className="w-4 h-4" /> Dark
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
export default Settings;
