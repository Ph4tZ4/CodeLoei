import { Search, HelpCircle, MessageSquare } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import CustomSelect from '../components/CustomSelect';

const Help = () => {
    const { t } = useLanguage();
    return (
        <div className="animate-fade-in max-w-3xl mx-auto">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-white mb-4">{t('support.help.title')}</h1>
                <div className="relative max-w-lg mx-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input type="text" className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-white focus:border-blue-500 outline-none" placeholder={t('support.help.search_placeholder')} />
                </div>
            </div>

            <div className="space-y-6">
                <h2 className="text-xl font-bold text-white mb-4">{t('support.help.faq.title')}</h2>
                {[
                    { q: t('support.help.faq.q1'), a: t('support.help.faq.a1') },
                    { q: t('support.help.faq.q2'), a: t('support.help.faq.a2') },
                    { q: t('support.help.faq.q3'), a: t('support.help.faq.a3') }
                ].map((faq, i) => (
                    <div key={i} className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-5 hover:bg-zinc-900/50 transition-colors">
                        <h3 className="font-bold text-white mb-2 flex items-center gap-2"><HelpCircle className="w-4 h-4 text-blue-500" /> {faq.q}</h3>
                        <p className="text-zinc-400 text-sm ml-6">{faq.a}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

import { useState } from 'react';

const Feedback = () => {
    const { t } = useLanguage();
    const [subject, setSubject] = useState('bug');

    return (
        <div className="animate-fade-in max-w-2xl mx-auto text-center pt-10">
            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-500">
                <MessageSquare className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-4">{t('support.feedback.title')}</h1>
            <p className="text-zinc-400 mb-8">{t('support.feedback.desc')}</p>

            <form className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-8 text-left space-y-4">
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">{t('support.feedback.subject')}</label>
                    <CustomSelect
                        value={subject}
                        onChange={setSubject}
                        options={[
                            { value: "bug", label: t('support.feedback.option.bug') },
                            { value: "feature", label: t('support.feedback.option.feature') },
                            { value: "general", label: t('support.feedback.option.general') }
                        ]}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5">{t('support.feedback.detail')}</label>
                    <textarea className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-white outline-none focus:border-blue-500 h-32" placeholder={t('support.feedback.placeholder')}></textarea>
                </div>
                <button type="button" className="w-full bg-blue-600 hover:bg-blue-500 text-absolute-white font-bold py-3 rounded-lg transition-colors">{t('support.feedback.submit')}</button>
            </form>
        </div>
    );
};

export { Help, Feedback };
