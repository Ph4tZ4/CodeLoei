import { Code, User, Share2, Cpu, Globe, Zap, Heart, Coffee } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const About = () => {
    const { t } = useLanguage();
    return (
        <div className="animate-fade-in max-w-5xl mx-auto pb-20 px-4 sm:px-6">
            {/* Hero Section */}
            <div className="text-center mb-20 pt-16">
                <div className="inline-block px-3 py-1 mb-4 text-xs font-mono text-pink-400 border border-pink-500/30 rounded-full bg-pink-500/10">
                    {t('about.hero.est')}
                </div>
                <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tight">
                    {t('about.hero.title1')} <br className="hidden md:block" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500">{t('about.hero.title2')}</span>
                </h1>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed">
                    {t('about.hero.desc')}
                </p>
            </div>

            {/* Core Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24">
                {[
                    {
                        icon: <Code className="w-6 h-6" />,
                        title: t('about.feature.repo.title'),
                        desc: t('about.feature.repo.desc')
                    },
                    {
                        icon: <User className="w-6 h-6" />,
                        title: t('about.feature.portfolio.title'),
                        desc: t('about.feature.portfolio.desc')
                    },
                    {
                        icon: <Share2 className="w-6 h-6" />,
                        title: t('about.feature.knowledge.title'),
                        desc: t('about.feature.knowledge.desc')
                    }
                ].map((item, i) => (
                    <div key={i} className="bg-zinc-900/50 border border-white/5 p-8 rounded-3xl hover:bg-zinc-800/50 hover:border-white/10 transition-all duration-300 group hover:-translate-y-1">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mb-6 text-text-muted group-hover:text-white group-hover:scale-110 transition-all">
                            {item.icon}
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                        <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                ))}
            </div>

            {/* Mission Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-24">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-6">
                        {t('about.mission.title')} <span className="text-pink-400">CodeLoei?</span>
                    </h2>
                    <div className="space-y-6 text-gray-400 leading-relaxed">
                        <p>
                            {t('about.mission.desc1')}
                        </p>
                        <p>
                            {t('about.mission.desc2')}
                        </p>
                    </div>
                </div>
                <div className="relative">
                    <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl opacity-20 blur-2xl"></div>
                    <div className="relative bg-zinc-900 border border-white/10 p-8 rounded-3xl">
                        <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-6">
                            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                                <Zap className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="text-white font-bold">{t('about.mission.fast.title')}</div>
                                <div className="text-xs text-gray-500">{t('about.mission.fast.desc')}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-6">
                            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <Globe className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="text-white font-bold">{t('about.mission.real.title')}</div>
                                <div className="text-xs text-gray-500">{t('about.mission.real.desc')}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500">
                                <Heart className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="text-white font-bold">{t('about.mission.community.title')}</div>
                                <div className="text-xs text-gray-500">{t('about.mission.community.desc')}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tech Stack Banner */}
            <div className="bg-zinc-900/30 border border-white/5 rounded-3xl p-10 text-center mb-24">
                <p className="text-gray-500 uppercase tracking-widest text-xs font-bold mb-8">{t('about.tech.title')}</p>
                <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                    {/* Mock Icons (Text for now as we don't have SVGs) */}
                    <span className="text-2xl font-bold text-white flex items-center gap-2"><Cpu className="w-6 h-6" /> React</span>
                    <span className="text-2xl font-bold text-white flex items-center gap-2"><Zap className="w-6 h-6" /> Vite</span>
                    <span className="text-2xl font-bold text-white flex items-center gap-2"><Globe className="w-6 h-6" /> Tailwind</span>
                    <span className="text-2xl font-bold text-white flex items-center gap-2"><Share2 className="w-6 h-6" /> Firebase</span>
                </div>
            </div>

            {/* Footer Quote */}
            <div className="text-center max-w-2xl mx-auto border-t border-white/10 pt-10">
                <Coffee className="w-8 h-8 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 italic mb-4">
                    {t('about.quote')}
                </p>
                <p className="text-gray-600 text-sm font-mono">- Linus Torvalds</p>
            </div>
        </div>
    );
};
export default About;