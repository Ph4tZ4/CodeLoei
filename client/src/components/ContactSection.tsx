import React, { useState } from 'react';
import { Send, Mail, User, MessageSquare, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '../lib/api';
import { useLanguage } from '../contexts/LanguageContext';

const ContactSection = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const { t } = useLanguage();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        try {
            await api.submitContact(formData);
            setStatus('success');
            setFormData({ name: '', email: '', subject: '', message: '' });
            setTimeout(() => setStatus('idle'), 5000);
        } catch (err: any) {
            setStatus('error');
            setErrorMessage(err.message || 'Something went wrong. Please try again.');
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto mt-32 px-4 relative z-10 mb-20">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-text-primary mb-6">
                    {t('contact.title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-violet-600">{t('contact.admin')}</span>
                </h2>
                <p className="text-text-muted text-lg max-w-2xl mx-auto">
                    {t('contact.desc')}
                </p>
            </div>

            <div className="bg-bg-tertiary backdrop-blur-md border border-border-primary rounded-2xl p-8 md:p-12 shadow-xl relative overflow-hidden group">
                {/* Glow Effect */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-pink-500/20 transition-all duration-1000"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-violet-600/20 transition-all duration-1000"></div>

                <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-muted flex items-center gap-2">
                                <User size={16} /> {t('contact.name')}
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full bg-bg-primary/50 border border-border-primary rounded-lg px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
                                placeholder={t('contact.placeholder.name')}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-text-muted flex items-center gap-2">
                                <Mail size={16} /> {t('contact.email')}
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full bg-bg-primary/50 border border-border-primary rounded-lg px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
                                placeholder={t('contact.placeholder.email')}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-muted flex items-center gap-2">
                            <MessageSquare size={16} /> {t('contact.subject')}
                        </label>
                        <input
                            type="text"
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            required
                            className="w-full bg-bg-primary/50 border border-border-primary rounded-lg px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all"
                            placeholder={t('contact.placeholder.subject')}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-text-muted flex items-center gap-2">
                            <MessageSquare size={16} /> {t('contact.message')}
                        </label>
                        <textarea
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            required
                            rows={5}
                            className="w-full bg-bg-primary/50 border border-border-primary rounded-lg px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all resize-none"
                            placeholder={t('contact.placeholder.message')}
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={status === 'loading' || status === 'success'}
                            className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all duration-300 ${status === 'success'
                                ? 'bg-green-500 text-white cursor-default'
                                : 'bg-gradient-to-r from-pink-600 to-rose-600 text-white hover:from-pink-500 hover:to-rose-500 hover:scale-[1.02] shadow-lg shadow-pink-500/25'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {status === 'loading' ? (
                                <>{t('contact.sending')}</>
                            ) : status === 'success' ? (
                                <><CheckCircle /> {t('contact.sent')}</>
                            ) : (
                                <><Send size={20} /> {t('contact.send')}</>
                            )}
                        </button>
                    </div>

                    {status === 'error' && (
                        <div className="flex items-center gap-2 text-red-400 bg-red-500/10 p-4 rounded-lg border border-red-500/20 animate-shake">
                            <AlertCircle size={20} />
                            <span>{errorMessage}</span>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default ContactSection;
