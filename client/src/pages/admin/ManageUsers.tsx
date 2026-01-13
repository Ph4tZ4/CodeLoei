import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
// We need User type. Assuming it's in types.
// If not, I'll define a local interface or check types file.
import type { User } from '../../types';
import { Link } from 'react-router-dom';
import { Trash2, Search, Mail, Shield, ShieldAlert, User as UserIcon, Pencil, Lock } from 'lucide-react';
import { useAlert } from '../../contexts/AlertContext';

export default function ManageUsers() {
    const { alert, confirm } = useAlert();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
            const data = await api.get('/users', token || undefined);
            setUsers(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!await confirm('คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้นี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้', undefined, 'danger')) return;
        try {
            const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
            if (!token) return;
            await api.delete(`/users/${id}`, token);
            setUsers(users.filter(u => u._id !== id));
        } catch (err) {
            console.error(err);
            await alert('Failed to delete user', undefined, 'danger');
        }
    };

    const filteredUsers = users.filter(u =>
        u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center text-zinc-400">Loading users...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <UserIcon className="w-6 h-6" /> จัดการผู้ใช้
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        จัดการบัญชีผู้ใช้และการเข้าถึงระบบ
                    </p>
                </div>
                <div className="text-sm text-zinc-400">
                    ผู้ใช้ทั้งหมด: <span className="text-zinc-200 font-semibold">{users.length}</span>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="ค้นหาผู้ใช้..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-zinc-200 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-zinc-400">
                        <thead className="bg-zinc-900/80 text-zinc-200 uppercase tracking-wider text-xs border-b border-zinc-800">
                            <tr>
                                <th className="px-6 py-4 font-semibold">ผู้ใช้</th>
                                <th className="px-6 py-4 font-semibold">บทบาท</th>
                                <th className="px-6 py-4 font-semibold">อีเมล</th>
                                <th className="px-6 py-4 font-semibold">วันที่เข้าร่วม</th>
                                <th className="px-6 py-4 font-semibold text-right">การจัดการ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                                        No users found.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user._id} className="hover:bg-zinc-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="relative">
                                                    <img
                                                        src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=333&color=fff`}
                                                        alt={user.displayName}
                                                        className={`w-8 h-8 rounded-full border border-zinc-700 object-cover ${user.isBanned ? 'grayscale' : ''}`}
                                                        onError={(e) => {
                                                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=333&color=fff`;
                                                        }}
                                                    />
                                                    {user.isBanned && (
                                                        <div className="absolute -top-1 -right-1 bg-red-600 rounded-full p-[2px] border border-zinc-900">
                                                            <Lock className="w-2 h-2 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="font-medium text-zinc-200 flex items-center gap-2">
                                                        {user.displayName}
                                                        {user.isBanned && (
                                                            <span className="bg-red-500/20 text-red-500 border border-red-500/30 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                                                BANNED
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.userType === 'admin' ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                                                    <ShieldAlert className="w-3 h-3" /> Admin
                                                </span>
                                            ) : user.userType === 'college_member' ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                                    <Shield className="w-3 h-3" /> College Member
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                                                    General
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <Mail className="w-3 h-3 text-zinc-600" />
                                                {user.email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {new Date(user.createdAt || Date.now()).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    to={`/admin/users/${user._id}`}
                                                    className="p-2 hover:bg-zinc-700/50 rounded-lg text-zinc-400 hover:text-blue-400 transition-colors"
                                                    title="Edit User"
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(user._id)}
                                                    className="p-2 hover:bg-red-500/10 rounded-lg text-zinc-400 hover:text-red-400 transition-colors"
                                                    title="Delete User"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
