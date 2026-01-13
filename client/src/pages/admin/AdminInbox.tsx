import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useLanguage } from '../../contexts/LanguageContext';
import { Mail, Search, Trash2, Reply, Clock, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { th, enUS } from 'date-fns/locale';

interface ContactMessage {
    _id: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    isRead: boolean;
    status: 'new' | 'read' | 'replied';
    createdAt: string;
}

const AdminInbox = () => {
    const { t, language } = useLanguage();
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Get token
    const token = localStorage.getItem('adminToken') || '';

    useEffect(() => {
        fetchMessages();
    }, []);

    const fetchMessages = async () => {
        if (!token) {
            setLoading(false);
            return;
        }
        try {
            const res = await api.getContacts(token);
            setMessages(res);
        } catch (err) {
            console.error('Failed to fetch messages', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectMessage = async (message: ContactMessage) => {
        setSelectedMessage(message);
        if (!message.isRead) {
            try {
                await api.markContactAsRead(message._id, token);
                setMessages(prev => prev.map(msg =>
                    msg._id === message._id ? { ...msg, isRead: true, status: 'read' } : msg
                ));
                setSelectedMessage(prev => prev ? { ...prev, isRead: true, status: 'read' } : null);
            } catch (err) {
                console.error('Failed to mark as read', err);
            }
        }
    };

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (!window.confirm(t('repo.delete_file.confirm') + '?')) return; // Reusing existing delete confirm string

        try {
            await api.deleteContact(id, token);
            setMessages(prev => prev.filter(msg => msg._id !== id));
            if (selectedMessage?._id === id) {
                setSelectedMessage(null);
            }
        } catch (err) {
            console.error('Failed to delete message', err);
            alert(t('repo.delete_file.failed'));
        }
    };

    const handleReply = () => {
        if (!selectedMessage) return;
        const subject = `Re: ${selectedMessage.subject}`;
        const body = `\n\n\n--- Original Message ---\nFrom: ${selectedMessage.name} <${selectedMessage.email}>\nSent: ${new Date(selectedMessage.createdAt).toLocaleString()}\nSubject: ${selectedMessage.subject}\n\n${selectedMessage.message}`;
        window.location.href = `mailto:${selectedMessage.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    const filteredMessages = messages.filter(msg =>
        msg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    return (
        <div className="animate-fade-in p-6 max-w-7xl mx-auto h-[Calc(100vh-100px)] flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Mail className="w-6 h-6 text-blue-500" />
                        {t('admin.inbox.title')}
                    </h1>
                    <p className="text-zinc-400 text-sm mt-1">{t('admin.inbox.subtitle')}</p>
                </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl flex flex-1 min-h-0">
                {/* Message List */}
                <div className={`w-full md:w-1/3 border-r border-zinc-800 flex flex-col ${selectedMessage ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-zinc-800">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input
                                type="text"
                                placeholder={t('admin.inbox.search_placeholder')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-black border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {filteredMessages.length === 0 ? (
                            <div className="p-8 text-center text-zinc-500">
                                <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>No messages found</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-zinc-800">
                                {filteredMessages.map((msg) => (
                                    <div
                                        key={msg._id}
                                        onClick={() => handleSelectMessage(msg)}
                                        className={`p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors ${selectedMessage?._id === msg._id ? 'bg-zinc-800' : ''} ${!msg.isRead ? 'border-l-2 border-blue-500 bg-blue-500/5' : 'border-l-2 border-transparent'}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className={`font-medium text-sm truncate pr-2 ${!msg.isRead ? 'text-white' : 'text-zinc-300'}`}>
                                                {msg.name}
                                            </h3>
                                            <span className="text-xs text-zinc-500 whitespace-nowrap flex-shrink-0">
                                                {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: language === 'th' ? th : enUS })}
                                            </span>
                                        </div>
                                        <p className={`text-sm mb-1 truncate ${!msg.isRead ? 'text-zinc-200 font-medium' : 'text-zinc-400'}`}>
                                            {msg.subject}
                                        </p>
                                        <div className="flex items-center justify-between mt-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 text-[10px] rounded-full ${msg.isRead
                                                    ? 'bg-zinc-800 text-zinc-400'
                                                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                                    }`}>
                                                    {msg.isRead ? 'Read' : 'New'}
                                                </span>
                                            </div>
                                            <button
                                                onClick={(e) => handleDelete(e, msg._id)}
                                                className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Message Detail */}
                <div className={`w-full md:w-2/3 bg-black flex flex-col ${!selectedMessage ? 'hidden md:flex' : 'flex'}`}>
                    {selectedMessage ? (
                        <>
                            <div className="p-6 border-b border-zinc-800 flex justify-between items-start gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-4">
                                        <button
                                            onClick={() => setSelectedMessage(null)}
                                            className="md:hidden p-2 -ml-2 text-zinc-400 hover:text-white"
                                        >
                                            <Reply className="w-5 h-5" />
                                        </button>
                                        <h2 className="text-xl font-bold text-white break-words">{selectedMessage.subject}</h2>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                                            {selectedMessage.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-white">{selectedMessage.name}</span>
                                                <span className="text-zinc-500 text-sm">&lt;{selectedMessage.email}&gt;</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                                                <Clock className="w-3 h-3" />
                                                <span>{new Date(selectedMessage.createdAt).toLocaleString(language === 'th' ? 'th-TH' : 'en-US')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleDelete({ stopPropagation: () => { } } as any, selectedMessage._id)}
                                        className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 p-6 overflow-y-auto bg-zinc-950">
                                <div className="prose prose-invert max-w-none">
                                    <p className="whitespace-pre-wrap text-zinc-300 leading-relaxed font-sans text-base">
                                        {selectedMessage.message}
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
                                <button
                                    onClick={handleReply}
                                    className="px-6 py-2.5 bg-white text-black hover:bg-zinc-200 rounded-lg font-medium flex items-center gap-2 transition-transform active:scale-95 shadow-lg shadow-white/5"
                                >
                                    <Reply className="w-4 h-4" />
                                    Reply via Email
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 bg-zinc-950/50">
                            <div className="w-16 h-16 rounded-2xl bg-zinc-900 flex items-center justify-center mb-4 border border-zinc-800">
                                <Mail className="w-8 h-8 opacity-50" />
                            </div>
                            <h3 className="text-lg font-medium text-white mb-1">Select a message</h3>
                            <p className="text-sm">Choose a message from the list to view details</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminInbox;
