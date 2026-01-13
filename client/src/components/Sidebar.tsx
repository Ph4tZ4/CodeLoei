import { User, Home, LayoutGrid, Info, Clock, Settings, HelpCircle, MessageSquare, ChevronRight } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

interface SidebarProps {
    user: any;
    onCloseMobile?: () => void;
}

const Sidebar = ({ user, onCloseMobile }: SidebarProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useLanguage();

    const SidebarItem = ({ path, label, icon: Icon, isAction = false, onClick }: any) => {
        const active = location.pathname === path;

        const handleClick = () => {
            if (onClick) {
                onClick();
            } else {
                navigate(path);
            }
            if (onCloseMobile) onCloseMobile();
        };

        return (
            <button
                onClick={handleClick}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm transition-all duration-200 ${active
                    ? 'bg-white text-black font-semibold shadow-lg'
                    : 'text-text-muted hover:text-white hover:bg-white/10'
                    }`}
            >
                <Icon className={`w-4 h-4 ${active ? 'text-black' : 'text-text-muted group-hover:text-white'}`} />
                <span>{label}</span>
                {isAction && <ChevronRight className="w-3 h-3 ml-auto opacity-50" />}
            </button>
        );
    };

    const isAdmin = location.pathname.startsWith('/admin');

    return (
        <div className="flex flex-col h-full">
            {/* Profile Section */}
            <div className="p-6 border-b border-zinc-800">
                <div className="flex items-center gap-3 mb-1 cursor-pointer hover:bg-zinc-900 rounded-md p-1 -m-1 transition-colors" onClick={() => navigate('/profile')}>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white to-gray-500 p-[1px]">
                        <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                            {user && user.photoURL ? (
                                <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-5 h-5 text-white" />
                            )}
                        </div>
                    </div>
                    <div className="overflow-hidden">
                        <h2 className="font-bold text-sm truncate">{user ? user.displayName || 'Student Name' : t('sidebar.guest')}</h2>
                        <p className="text-gray-500 text-xs truncate">{user ? user.email || '@it_student' : '@guest'}</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
                {isAdmin ? (
                    <>
                        <div className="px-3 mb-2 text-xs font-semibold text-red-500 uppercase tracking-wider flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                            แผงควบคุมส่วนกลาง
                        </div>
                        <SidebarItem path="/admin/dashboard" label="แดชบอร์ด" icon={LayoutGrid} />
                        <SidebarItem path="/admin/projects" label="จัดการโครงการ" icon={Settings} />
                        <SidebarItem path="/admin/users" label="จัดการผู้ใช้" icon={User} />
                        <SidebarItem path="/admin/news" label="จัดการข่าวสาร" icon={MessageSquare} />
                    </>
                ) : (
                    <>
                        <SidebarItem path="/" label={t('sidebar.home')} icon={Home} />
                        <SidebarItem path="/projects" label={t('sidebar.all_projects')} icon={LayoutGrid} />
                        <SidebarItem path="/about" label={t('sidebar.about')} icon={Info} />

                        <div className="my-4 border-t border-zinc-800/80 mx-2" />

                        <div className="px-3 mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">{t('sidebar.activity_section')}</div>
                        <SidebarItem path="/history" label={t('sidebar.history')} icon={Clock} />
                    </>
                )}
            </div>

            {/* Bottom Section */}
            <div className="p-3 border-t border-zinc-800 mt-auto bg-zinc-950/30 rounded-b-lg space-y-1">
                {!isAdmin ? (
                    <>
                        <SidebarItem path="/settings" label={t('sidebar.settings')} icon={Settings} />
                        <SidebarItem path="/help" label={t('sidebar.help')} icon={HelpCircle} />
                        <SidebarItem path="/feedback" label={t('sidebar.feedback')} icon={MessageSquare} />
                    </>
                ) : (
                    <SidebarItem
                        path="/admin/login"
                        label={t('sidebar.admin_logout')}
                        icon={Home}
                        isAction
                        onClick={() => {
                            localStorage.removeItem('adminToken');
                            navigate('/admin/login', { state: { accessGranted: true } });
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default Sidebar;
