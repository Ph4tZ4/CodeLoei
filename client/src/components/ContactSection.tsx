import React, { useState } from 'react';
import { Send, Mail, User, MessageSquare, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';

interface ContactSectionProps {
    initialData?: {
        name?: string;
        email?: string;
        subject?: string;
        message?: string;
    };
    readOnlyFields?: string[];
    className?: string;
    hideHeader?: boolean;
}

const ContactSection = ({ initialData = {}, readOnlyFields = [], className = '', hideHeader = false }: ContactSectionProps) => {
    const [formData, setFormData] = useState({
        name: initialData.name || '',
        email: initialData.email || '',
        subject: initialData.subject || '',
        message: initialData.message || ''
    });
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const { t } = useLanguage();

    // Sync local state when initialData changes (e.g. user loads)
    React.useEffect(() => {
        setFormData(prev => ({
            ...prev,
            name: initialData.name || prev.name,
            email: initialData.email || prev.email,
        }));
    }, [initialData.name, initialData.email]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        try {
            await api.submitContact(formData);
            setStatus('success');
            setFormData({
                name: initialData.name || '',
                email: initialData.email || '',
                subject: '',
                message: ''
            });
            setTimeout(() => setStatus('idle'), 5000);
        } catch (err: any) {
            setStatus('error');
            setErrorMessage(err.message || 'Something went wrong. Please try again.');
        }
    };

    return (
        <div className={`w-full max-w-2xl mx-auto px-4 relative z-10 mb-20 mt-12 ${className}`}>
            <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 md:p-8 backdrop-blur-sm shadow-xl">
                {!hideHeader && (
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {t('contact.title')}
                        </h2>
                        <p className="text-zinc-400 text-sm">
                            {t('contact.desc')}
                        </p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="block text-xs font-medium text-zinc-400">
                                {t('contact.name')}
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder={t('contact.placeholder.name')}
                                    required
                                    disabled={readOnlyFields.includes('name')}
                                    className={`w-full bg-black border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm
                                        ${readOnlyFields.includes('name') ? 'opacity-60 cursor-not-allowed bg-zinc-900/50' : ''}
                                    `}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-medium text-zinc-400">
                                {t('contact.email')}
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder={t('contact.placeholder.email')}
                                    required
                                    disabled={readOnlyFields.includes('email')}
                                    className={`w-full bg-black border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm
                                        ${readOnlyFields.includes('email') ? 'opacity-60 cursor-not-allowed bg-zinc-900/50' : ''}
                                    `}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-medium text-zinc-400">
                            {t('contact.subject')}
                        </label>
                        <div className="relative">
                            <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input
                                type="text"
                                name="subject"
                                value={formData.subject}
                                onChange={handleChange}
                                placeholder={t('contact.placeholder.subject')}
                                required
                                className="w-full bg-black border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-white placeholder-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-medium text-zinc-400">
                            {t('contact.message')}
                        </label>
                        <textarea
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            placeholder={t('contact.placeholder.message')}
                            required
                            rows={5}
                            className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all text-sm resize-none"
                        />
                    </div>

                    {status === 'success' && (
                        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-3 text-green-400 text-sm animate-in fade-in slide-in-from-bottom-2">
                            <CheckCircle className="w-5 h-5 flex-shrink-0" />
                            <p>{t('contact.sent')}</p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-400 text-sm animate-in fade-in slide-in-from-bottom-2">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p>{errorMessage}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="w-full bg-white text-black hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium py-2.5 rounded-lg transition-all transform active:scale-[0.99] flex items-center justify-center gap-2 text-sm shadow-lg shadow-white/5"
                    >
                        {status === 'loading' ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {t('contact.sending')}
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4" />
                                {t('contact.send')}
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ContactSection;
