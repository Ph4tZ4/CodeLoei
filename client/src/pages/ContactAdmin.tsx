import { useOutletContext } from 'react-router-dom';
import ContactSection from '../components/ContactSection';
import { MessageSquare, MapPin, Phone, Mail, Clock } from 'lucide-react';

import { useLanguage } from '../contexts/LanguageContext';

const ContactAdmin = () => {
    const { user } = useOutletContext<any>();
    const { t } = useLanguage();

    return (
        <div className="animate-fade-in">
            <div className="space-y-6">
                {/* Header */}
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <MessageSquare className="w-6 h-6 text-white" /> {t('contact.title')}
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                        {t('contact.desc')}
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Contact Form - Takes up 2 columns */}
                    <div className="lg:col-span-2">
                        <ContactSection
                            initialData={{
                                name: user?.displayName,
                                email: user?.email
                            }}
                            readOnlyFields={['name', 'email']}
                            className="!mt-0 !max-w-full !px-0"
                            hideHeader={true}
                        />
                    </div>

                    {/* Contact Info - Takes up 1 column */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
                            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                                {t('contact.info.title')}
                            </h3>

                            <div className="space-y-6">
                                {/* Address */}
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                        <MapPin className="w-5 h-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-zinc-300 mb-1">{t('contact.info.address')}</h4>
                                        <p className="text-sm text-zinc-500 leading-relaxed">
                                            {t('contact.info.address_value')}
                                        </p>
                                    </div>
                                </div>

                                {/* Phone */}
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                        <Phone className="w-5 h-5 text-green-500" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-zinc-300 mb-1">{t('contact.info.phone')}</h4>
                                        <p className="text-sm text-zinc-500">
                                            {t('contact.info.phone_value')}
                                        </p>
                                    </div>
                                </div>

                                {/* Email */}
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                        <Mail className="w-5 h-5 text-purple-500" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-zinc-300 mb-1">{t('contact.info.email_official')}</h4>
                                        <p className="text-sm text-zinc-500">
                                            {t('contact.info.email_value')}
                                        </p>
                                    </div>
                                </div>

                                {/* Hours */}
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                        <Clock className="w-5 h-5 text-orange-500" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-zinc-300 mb-1">{t('contact.info.hours')}</h4>
                                        <p className="text-sm text-zinc-500">
                                            {t('contact.info.hours_value')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactAdmin;
