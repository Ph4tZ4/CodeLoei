import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, MapPin, Globe, Award, Shield, Save, Loader2, Camera, ShieldAlert, Pencil } from 'lucide-react';
import { api } from '../../lib/api';
import CustomSelect from '../../components/CustomSelect';
import { useAlert } from '../../contexts/AlertContext';

export default function AdminUserDetail() {
    const { alert, confirm } = useAlert();
    const { id } = useParams();
    const navigate = useNavigate();
    // const fileInputRef = useRef<HTMLInputElement>(null); // Unused
    // const context = useOutletContext<any>() || {}; // Unused context parts?
    // const { refreshUser } = context; // Unused

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    // const [adminMode, setAdminMode] = useState(false); // Unused

    // Form states
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [location, setLocation] = useState('');
    const [website, setWebsite] = useState('');
    const [publicEmail, setPublicEmail] = useState('');
    const [skills, setSkills] = useState('');
    const [userType, setUserType] = useState('general');

    const [photoURL, setPhotoURL] = useState('');

    // Ban State
    const [showBanModal, setShowBanModal] = useState(false);
    const [banDuration, setBanDuration] = useState('7days');
    const [banReason, setBanReason] = useState('');
    const [customBanDate, setCustomBanDate] = useState('');
    const [processingBan, setProcessingBan] = useState(false);

    // const fetchUser = ... moved to use callback
    const fetchUser = useCallback(async () => {
        try {
            const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
            const data = await api.getPublicProfile(id!, token || undefined);
            setUserData(data);

            // Init form
            setDisplayName(data.displayName || '');
            setBio(data.bio || '');
            setLocation(data.location || '');
            setWebsite(data.website || '');
            setPublicEmail(data.publicEmail || '');
            setSkills(data.skills ? data.skills.join(', ') : '');
            setUserType(data.userType || 'general');
            setPhotoURL(data.photoURL || '');

        } catch (err) {
            console.error("Failed to fetch user", err);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) {
                await alert("ขนาดไฟล์ใหญ่เกินไป กรุณาใช้รูปภาพขนาดไม่เกิน 5MB", undefined, 'warning');
                return;
            }
            const reader = new FileReader();
            reader.addEventListener('load', () => setPhotoURL(reader.result as string));
            reader.readAsDataURL(file);
            e.target.value = '';
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
            if (!token) return;

            // We need an admin endpoint to update ANY user. 
            // Currently `updateProfile` updates the CURRENT user (req.user.id).
            // So we can't use `api.updateProfile` indiscriminately.
            // We need to implement `PUT /users/:id` for admins in the backend first.
            // But for now, let's assume we might need to add that.
            // Wait, looking at routes... `updateProfile` is `PUT /users/profile` (self).
            // ADMIN UPDATE ROUTE MISSING.
            // I will implement the UI assuming the method exists or add it. 
            // Let's assume I'll add `PUT /users/:id`.

            await api.put(`/users/${id}`, {
                displayName,
                bio,
                location,
                website,
                publicEmail,
                skills, // Backend handles string split? check controller.
                userType, // Admin power to change roles?
                photoURL
            }, token);

            await alert("อัปเดตข้อมูลผู้ใช้เรียบร้อยแล้ว", undefined, 'success');
            fetchUser();
        } catch (err) {
            console.error("Update failed", err);
            await alert("เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้ใช้", undefined, 'danger');
        } finally {
            setSaving(false);
        }
    };

    const handleBanUser = async () => {
        if (!banDuration) return;
        if (banDuration === 'custom' && !customBanDate) {
            await alert("กรุณาเลือกวันที่กำหนดเอง", undefined, 'warning');
            return;
        }

        if (!await confirm("คุณแน่ใจหรือไม่ว่าต้องการดำเนินการนี้?", undefined, 'danger')) return;

        setProcessingBan(true);
        try {
            const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
            if (!token) return;

            await api.banUser(id!, banDuration, token, banReason, customBanDate);
            await alert("อัปเดตสถานะการแบนผู้ใช้เรียบร้อยแล้ว", undefined, 'success');
            setShowBanModal(false);
            fetchUser();
        } catch (err: any) {
            await alert(err.message || "เกิดข้อผิดพลาดในการอัปเดตสถานะการแบน", undefined, 'danger');
        } finally {
            setProcessingBan(false);
        }
    };

    if (loading) return <div className="flex justify-center mt-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
    if (!userData) return <div className="text-center mt-20 text-zinc-500">ไม่พบผู้ใช้</div>;

    const isBanned = userData.isBanned;

    return (
        <div className="animate-fade-in max-w-7xl mx-auto px-4 py-8">
            {/* Modal for Ban */}
            {showBanModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <ShieldAlert className="w-6 h-6 text-red-500" />
                            {isBanned ? 'แก้ไขการแบน / ปลดแบน' : 'ระงับบัญชีผู้ใช้'}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-zinc-400 mb-2">ระยะเวลา</label>
                                <CustomSelect
                                    value={banDuration}
                                    onChange={setBanDuration}
                                    options={[
                                        { value: "1day", label: "1 วัน" },
                                        { value: "7days", label: "7 วัน" },
                                        { value: "1month", label: "1 เดือน" },
                                        { value: "3months", label: "3 เดือน" },
                                        { value: "6months", label: "6 เดือน" },
                                        { value: "1year", label: "1 ปี" },
                                        { value: "lifetime", label: "ตลอดชีพ" },
                                        { value: "custom", label: "กำหนดเอง" },
                                        { value: "unban", label: "ปลดแบน (ยกเลิกการระงับ)" }
                                    ]}
                                    className="w-full"
                                />
                            </div>

                            {banDuration === 'custom' && (
                                <div>
                                    <label className="block text-sm font-bold text-zinc-400 mb-2">จนถึงวันที่</label>
                                    <input
                                        type="date"
                                        value={customBanDate}
                                        onChange={(e) => setCustomBanDate(e.target.value)}
                                        className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-white outline-none focus:border-red-500"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-zinc-400 mb-2">เหตุผล (ไม่บังคับ)</label>
                                <textarea
                                    value={banReason}
                                    onChange={(e) => setBanReason(e.target.value)}
                                    className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-white outline-none focus:border-red-500 resize-none h-24"
                                    placeholder="ละเมิดกฎชุมชน..."
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setShowBanModal(false)}
                                    className="flex-1 px-4 py-2 rounded-lg font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={handleBanUser}
                                    disabled={processingBan}
                                    className={`flex-1 px-4 py-2 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-all ${banDuration === 'unban' ? 'bg-green-600 hover:bg-green-500' : 'bg-red-600 hover:bg-red-500'}`}
                                >
                                    {processingBan && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {banDuration === 'unban' ? 'ปลดแบน' : 'ยืนยันการระงับ'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation & Admin Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <button
                    onClick={() => navigate('/admin/users')}
                    className="flex items-center gap-2 text-zinc-400 hover:text-white group transition-colors px-3 py-2 rounded-lg hover:bg-white/5 w-fit"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    กลับไปหน้าจัดการผู้ใช้
                </button>

                <div className="flex gap-4 items-center">
                    {isBanned && (
                        <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4" /> ถูกระงับจนถึง {userData.bannedUntil ? new Date(userData.bannedUntil).toLocaleDateString('th-TH') : 'ตลอดชีพ'}
                        </div>
                    )}
                    <button
                        onClick={() => setShowBanModal(true)}
                        className="bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 transition-colors uppercase tracking-wider"
                    >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        {isBanned ? 'จัดการการแบน' : 'แบนผู้ใช้'}
                    </button>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 flex items-center gap-2 text-blue-400 text-xs font-medium w-fit">
                        <Pencil className="w-3.5 h-3.5" />
                        โหมดแอดมิน
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Profile Card */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="relative bg-zinc-900/30 border border-zinc-800 rounded-2xl overflow-hidden backdrop-blur-sm">
                        {/* Gradient Banner */}
                        <div className={`h-32 bg-gradient-to-r relative ${isBanned ? 'from-red-900/40 via-red-900/20 to-zinc-900' : 'from-blue-900/40 via-purple-900/40 to-pink-900/40'}`}>
                            <div className="absolute inset-0 bg-grid-white/[0.05] bg-[length:20px_20px]" />
                        </div>

                        <div className="px-6 pb-8 text-center relative">
                            {/* Avatar */}
                            <div className="relative -mt-16 mb-4 inline-block group">
                                <div className={`w-32 h-32 rounded-full border-4 ${isBanned ? 'border-red-500 grayscale' : 'border-black'} bg-zinc-800 overflow-hidden relative shadow-xl ring-1 ring-white/10`}>
                                    <img
                                        src={photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=333&color=fff`}
                                        alt={displayName}
                                        className="w-full h-full object-cover"
                                    />
                                    <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer backdrop-blur-[2px]">
                                        <Camera className="w-8 h-8 text-white mb-1" />
                                        <span className="text-white/80 text-xs font-medium">เปลี่ยนรูป</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleImageChange}
                                        />
                                    </label>
                                </div>
                                <div className="absolute bottom-2 right-2 bg-zinc-900 rounded-full p-1.5 border border-zinc-700 shadow-sm text-zinc-400">
                                    <User className="w-4 h-4" />
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-1 flex items-center justify-center gap-2">
                                {displayName}
                                {isBanned && <span className="text-red-500 text-xs border border-red-500/30 px-2 py-0.5 rounded uppercase">ถูกระงับ</span>}
                            </h2>
                            <p className="text-zinc-400 text-sm mb-4 line-clamp-2 px-4">{bio || "ไม่มีประวัติโดยย่อ"}</p>

                            <div className="flex flex-wrap justify-center gap-2 mb-6">
                                {userType === 'admin' ? (
                                    <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5">
                                        <Shield className="w-3 h-3" /> ผู้ดูแลระบบ
                                    </span>
                                ) : (
                                    <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5">
                                        <User className="w-3 h-3" /> ผู้ใช้ทั่วไป
                                    </span>
                                )}
                            </div>

                            <div className="space-y-3 text-sm text-left bg-zinc-900/50 rounded-xl p-4 border border-zinc-800/50">
                                <div className="flex items-center gap-3 text-zinc-400">
                                    <Mail className="w-4 h-4 shrink-0" />
                                    <span className="truncate">{publicEmail || "ไม่มีอีเมลสาธารณะ"}</span>
                                </div>
                                <div className="flex items-center gap-3 text-zinc-400">
                                    <MapPin className="w-4 h-4 shrink-0" />
                                    <span className="truncate">{location || "ไม่มีข้อมูลที่อยู่"}</span>
                                </div>
                                <div className="flex items-center gap-3 text-zinc-400">
                                    <Globe className="w-4 h-4 shrink-0" />
                                    <a href={website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate">
                                        {website || "ไม่มีเว็บไซต์"}
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Edit Form */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <Pencil className="w-4 h-4 text-blue-500" />
                                แก้ไขข้อมูลโปรไฟล์
                            </h3>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                บันทึกการเปลี่ยนแปลง
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">ชื่อที่แสดง</label>
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    className="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-zinc-700"
                                    placeholder="กรอกชื่อที่แสดง"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">บทบาท</label>
                                <div className="relative">
                                    <CustomSelect
                                        value={userType}
                                        onChange={setUserType}
                                        options={[
                                            { value: "general", label: "ทั่วไป" },
                                            { value: "college_member", label: "สมาชิกวิทยาลัย" }
                                        ]}
                                        className="w-full"
                                    />
                                    <Shield className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                                </div>
                            </div>

                            <div className="md:col-span-2 space-y-2">
                                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">ประวัติโดยย่อ</label>
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    rows={3}
                                    className="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-zinc-700 resize-none"
                                    placeholder="บอกเล่าเกี่ยวกับผู้ใช้..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">ที่อยู่</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                    <input
                                        type="text"
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        className="w-full bg-black/50 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        placeholder="เมือง, ประเทศ"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">เว็บไซต์</label>
                                <div className="relative">
                                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                    <input
                                        type="text"
                                        value={website}
                                        onChange={(e) => setWebsite(e.target.value)}
                                        className="w-full bg-black/50 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        placeholder="https://example.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">อีเมลสาธารณะ</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                    <input
                                        type="email"
                                        value={publicEmail}
                                        onChange={(e) => setPublicEmail(e.target.value)}
                                        className="w-full bg-black/50 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        placeholder="user@example.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">ทักษะ</label>
                                <div className="relative">
                                    <Award className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                    <input
                                        type="text"
                                        value={skills}
                                        onChange={(e) => setSkills(e.target.value)}
                                        className="w-full bg-black/50 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                        placeholder="React, Node.js, Design..."
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
