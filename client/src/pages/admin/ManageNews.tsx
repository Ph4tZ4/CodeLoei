import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import type { News } from '../../types';
import { Trash2, Edit2, Plus, X, MessageSquare } from 'lucide-react';
import CustomSelect from '../../components/CustomSelect';
import { useAlert } from '../../contexts/AlertContext';

interface NewsFormData {
    title: string;
    category: string;
    categoryColor: string;
    description: string;
    content: string; // HTML
    isPopup: boolean;
    popupDuration: number;
}

const initialForm: NewsFormData = {
    title: '',
    category: 'ACADEMIC',
    categoryColor: 'text-blue-400',
    description: '',
    content: '',
    isPopup: false,
    popupDuration: 7
};

const CATEGORY_OPTIONS = [
    { value: 'ACADEMIC', label: 'ACADEMIC' },
    { value: 'SYSTEM UPDATE', label: 'SYSTEM UPDATE' },
    { value: 'EVENT', label: 'EVENT' },
    { value: 'ANNOUNCEMENT', label: 'ANNOUNCEMENT' },
    { value: 'ACTIVITY', label: 'ACTIVITY' },
    { value: 'SCHOLARSHIP', label: 'SCHOLARSHIP' },
];

const COLOR_OPTIONS = [
    { value: 'text-blue-400', label: 'Blue', className: 'text-blue-400' },
    { value: 'text-green-400', label: 'Green', className: 'text-green-400' },
    { value: 'text-purple-400', label: 'Purple', className: 'text-purple-400' },
    { value: 'text-red-400', label: 'Red', className: 'text-red-400' },
    { value: 'text-yellow-400', label: 'Yellow', className: 'text-yellow-400' },
    { value: 'text-pink-400', label: 'Pink', className: 'text-pink-400' },
];

export default function ManageNews() {
    const { alert, confirm } = useAlert();
    const [newsList, setNewsList] = useState<News[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<NewsFormData>(initialForm);


    useEffect(() => {
        fetchNews();
    }, []);

    const fetchNews = async () => {
        try {
            const data = await api.get('/news');
            setNewsList(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!await confirm('คุณแน่ใจหรือไม่ว่าต้องการลบข่าวนี้?', undefined, 'danger')) return;
        try {
            const token = localStorage.getItem('adminToken') || '';
            await api.delete(`/news/${id}`, token);
            setNewsList(newsList.filter(n => n._id !== id));
        } catch (err) {
            console.error(err);
            await alert('Failed to delete news', undefined, 'danger');
        }
    };

    const handleEdit = (news: News) => {
        setFormData({
            title: news.title,
            category: news.category,
            categoryColor: news.categoryColor || 'text-blue-400',
            description: news.description,
            content: news.content,
            isPopup: news.isPopup || false,
            popupDuration: news.popupDuration || 0
        });
        setEditingId(news._id);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setFormData(initialForm);
        setEditingId(null);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Auto-generate description from content if possible
        const stripHtml = (html: string) => {
            const tmp = document.createElement("DIV");
            tmp.innerHTML = html;
            return tmp.textContent || tmp.innerText || "";
        }

        const finalData = {
            ...formData,
            description: formData.description || stripHtml(formData.content).substring(0, 200)
        };

        try {
            if (editingId) {
                // Update
                const token = localStorage.getItem('adminToken') || '';
                const updated = await api.put(`/news/${editingId}`, finalData, token);
                setNewsList(newsList.map(n => n._id === editingId ? updated : n));
            } else {
                // Create
                const token = localStorage.getItem('adminToken') || '';
                const created = await api.post('/news', finalData, token);
                setNewsList([created, ...newsList]);
            }
            setIsModalOpen(false);
        } catch (err) {
            console.error(err);
            await alert('Failed to save news', undefined, 'danger');
        }
    };

    if (loading) return <div className="p-8 text-center text-zinc-400">Loading news...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <MessageSquare className="w-6 h-6" /> จัดการข่าวสาร
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        ประชาสัมพันธ์ข่าวสารและกิจกรรมต่างๆ
                    </p>
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors font-medium"
                >
                    <Plus className="w-4 h-4" />
                    สร้างข่าว
                </button>
            </div>

            {/* List */}
            <div className="grid gap-4">
                {newsList.map(news => (
                    <div key={news._id} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex justify-between gap-4 items-start hover:border-zinc-700 transition-colors">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs font-bold uppercase tracking-wider ${news.categoryColor}`}>
                                    {news.category}
                                </span>
                                <span className="text-zinc-600 text-xs">•</span>
                                <span className="text-zinc-500 text-xs">
                                    {new Date(news.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <h3 className="text-lg font-semibold text-zinc-200 mb-1">{news.title}</h3>
                            <p className="text-zinc-400 text-sm line-clamp-2">{news.description}</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleEdit(news)}
                                className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-blue-400 transition-colors"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => handleDelete(news._id)}
                                className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-red-400 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="sticky top-0 bg-zinc-900/95 backdrop-blur z-10 p-6 border-b border-zinc-800 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">
                                {editingId ? 'แก้ไขข่าว' : 'สร้างข่าว'}
                            </h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">

                            {(() => {
                                return (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-400 mb-1">หัวข้อ</label>
                                            <input
                                                type="text"
                                                required
                                                value={formData.title}
                                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                                className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-zinc-400 mb-1">หมวดหมู่</label>
                                                <CustomSelect
                                                    required
                                                    value={formData.category}
                                                    onChange={val => setFormData({ ...formData, category: val })}
                                                    options={CATEGORY_OPTIONS}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-zinc-400 mb-1">สีของหมวดหมู่</label>
                                                <CustomSelect
                                                    value={formData.categoryColor}
                                                    onChange={val => setFormData({ ...formData, categoryColor: val })}
                                                    options={COLOR_OPTIONS}
                                                />
                                            </div>
                                        </div>

                                        <div className="bg-zinc-800/50 p-4 rounded-lg border border-zinc-800 space-y-4">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    id="isPopup"
                                                    checked={formData.isPopup}
                                                    onChange={e => setFormData({ ...formData, isPopup: e.target.checked })}
                                                    className="w-4 h-4 rounded border-zinc-700 bg-black text-blue-600 focus:ring-blue-600 focus:ring-offset-zinc-900"
                                                />
                                                <label htmlFor="isPopup" className="text-sm font-medium text-zinc-300 select-none cursor-pointer">
                                                    แสดงเป็น Pop-up เมื่อเข้าเว็บไซต์
                                                </label>
                                            </div>

                                            {formData.isPopup && (
                                                <div>
                                                    <label className="block text-sm font-medium text-zinc-400 mb-1">ระยะเวลาแสดงผล (นับจากวันที่สร้าง)</label>
                                                    <CustomSelect
                                                        value={formData.popupDuration.toString()}
                                                        onChange={val => setFormData({ ...formData, popupDuration: parseInt(val) })}
                                                        options={[
                                                            { value: '7', label: '7 วัน' },
                                                            { value: '15', label: '15 วัน' },
                                                            { value: '30', label: '30 วัน' },
                                                            { value: '0', label: 'จนกว่าจะปิด (ตลอดไป)' },
                                                        ]}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-zinc-400 mb-1">เนื้อหา HTML</label>
                                            <textarea
                                                required
                                                rows={8}
                                                value={formData.content}
                                                onChange={e => setFormData({ ...formData, content: e.target.value })}
                                                className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white font-mono text-sm focus:outline-none focus:border-blue-500"
                                                placeholder="<p>เนื้อหาข่าว...</p>"
                                            />
                                            <p className="text-xs text-zinc-500 mt-1">
                                                รองรับ HTML tags เช่น &lt;p&gt;, &lt;h3&gt;, &lt;ul&gt;, &lt;li&gt;, ฯลฯ
                                            </p>
                                        </div>
                                    </>
                                );
                            })()}

                            <div className="flex justify-end pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-zinc-400 hover:text-white mr-4"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium"
                                >
                                    {editingId ? 'อัปเดตข่าว' : 'สร้างข่าว'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
