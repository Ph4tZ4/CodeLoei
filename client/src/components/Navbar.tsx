import { useState, useRef, useEffect } from 'react';
import { Menu, Terminal, Search, User, ChevronRight, LayoutDashboard, Plus, LogOut, Folder, Moon, Sun } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';

interface NavbarProps {
    user: any;
    onLogout: () => void;
    onOpenAuth: (mode?: 'login' | 'register') => void;
    onToggleMenu?: () => void;
    onOpenUpload: () => void;
}

const Navbar = ({
    user,
    onLogout,
    onOpenAuth,
    onToggleMenu,
    onOpenUpload
}: NavbarProps) => {
    const { t, language, setLanguage } = useLanguage();
    const { theme, toggleTheme } = useTheme();
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const location = useLocation();
    // Landing page is strictly '/' AND user is NOT logged in.
    // If user IS logged in, '/' renders Home content, so it should have search bar.
    // Actually, simply: show search bar if user is logged in OR path is not '/'.
    // Wait, if user is NOT logged in, and path is NOT '/', e.g. /about, search bar should show?
    // User originally said: "If in Landing page, no search bar".
    // Landing page only appears at '/' when !user.
    // So if (!user && location.pathname === '/'), hide search bar.
    // Otherwise show it.
    const isLandingPage = !user && location.pathname === '/';

    const [secretCount, setSecretCount] = useState(0);
    const lastClickTimeRef = useRef(0);

    const handleLogoClick = () => {
        const now = Date.now();
        if (now - lastClickTimeRef.current > 2000) {
            // Reset if more than 2 seconds passed
            setSecretCount(1);
        } else {
            const newCount = secretCount + 1;
            setSecretCount(newCount);
            if (newCount === 5) {
                // Open in new tab with access token query param
                window.open('/admin/login?access=true', '_blank');
                setSecretCount(0);
            }
        }
        lastClickTimeRef.current = now;
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <nav className="fixed top-0 w-full z-50 bg-bg-primary/80 backdrop-blur-md border-b border-white/10 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-4">
                        {/* Mobile Menu Button */}
                        {user && (
                            <button
                                onClick={onToggleMenu}
                                className="lg:hidden p-2 -ml-2 text-text-muted hover:text-text-primary rounded-md"
                            >
                                <Menu className="w-6 h-6" />
                            </button>
                        )}

                        <div
                            onClick={handleLogoClick}
                            className="flex items-center gap-2 cursor-pointer group select-none"
                        >
                            <Terminal className="w-8 h-8 text-text-primary group-hover:text-text-muted transition-colors" />
                        </div>
                    </div>

                    {!isLandingPage && (
                        <div className="hidden md:block flex-1 max-w-md mx-8">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-text-muted" />
                                </div>
                                <input
                                    type="text"
                                    className="block w-full pl-10 pr-3 py-2 border border-border-primary rounded-md leading-5 bg-bg-secondary/50 text-text-primary placeholder-text-muted focus:outline-none focus:bg-bg-secondary focus:border-text-muted focus:ring-1 focus:ring-text-muted sm:text-sm transition-all"
                                    placeholder={t('nav.search_placeholder')}
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        {!user && (
                            <>
                                <div className="fixed left-4 top-24 z-50 flex flex-row gap-3 md:static md:flex-row md:items-center md:gap-0">
                                    {/* Theme Toggle */}
                                    <button
                                        onClick={toggleTheme}
                                        className="w-10 h-10 bg-bg-secondary/90 backdrop-blur-sm border border-white/10 shadow-xl rounded-full text-text-primary flex items-center justify-center transition-all hover:scale-110 md:w-auto md:h-auto md:bg-transparent md:backdrop-blur-none md:border-0 md:shadow-none md:text-text-muted md:hover:scale-100 md:hover:text-text-primary md:hover:bg-white/10 md:p-2"
                                        aria-label="Toggle Theme"
                                    >
                                        {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                                    </button>

                                    {/* Language Toggle */}
                                    <button
                                        onClick={() => setLanguage(language === 'th' ? 'en' : 'th')}
                                        className="w-10 h-10 bg-bg-secondary/90 backdrop-blur-sm border border-white/10 shadow-xl rounded-full text-text-primary font-mono font-bold text-sm flex items-center justify-center transition-all hover:scale-110 md:w-9 md:h-9 md:bg-transparent md:backdrop-blur-none md:border-0 md:shadow-none md:text-text-muted md:hover:scale-100 md:hover:text-text-primary md:hover:bg-white/10 md:p-2"
                                        aria-label="Toggle Language"
                                    >
                                        {language === 'th' ? 'TH' : 'EN'}
                                    </button>
                                </div>

                                <div className="h-6 w-[1px] bg-white/10 hidden md:block"></div>
                            </>
                        )}

                        {user ? (
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                    className="flex items-center gap-2 text-sm text-text-muted hover:text-white transition-colors focus:outline-none"
                                >
                                    <div className="w-8 h-8 rounded-full border border-text-muted flex items-center justify-center overflow-hidden bg-transparent text-text-muted group-hover:border-text-primary group-hover:text-text-primary transition-all">
                                        {user.photoURL ? (
                                            <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="w-5 h-5" />
                                        )}
                                    </div>
                                    <span className="hidden sm:inline font-mono">{user.displayName || 'Student_ID'}</span>
                                    <ChevronRight className={`w-3 h-3 transition-transform ${isProfileMenuOpen ? 'rotate-90' : 'rotate-0'}`} />
                                </button>

                                {/* Profile Dropdown */}
                                {isProfileMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl py-1 animate-fade-in overflow-hidden z-[70]">
                                        <div className="px-4 py-3 border-b border-zinc-800">
                                            <p className="text-xs text-gray-500">{t('nav.logged_in_as')}</p>
                                            <p className="text-sm font-bold text-white truncate">{user.email || 'Anonymous'}</p>
                                        </div>

                                        <div className="py-1">
                                            <button
                                                onClick={() => { navigate('/profile'); setIsProfileMenuOpen(false); }}
                                                className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-text-muted hover:bg-zinc-900 hover:text-white transition-colors"
                                            >
                                                <User className="w-4 h-4" /> {t('nav.profile')}
                                            </button>
                                            {user.userType === 'college_member' && (
                                                <button
                                                    onClick={() => { navigate('/my-projects'); setIsProfileMenuOpen(false); }}
                                                    className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-text-muted hover:bg-zinc-900 hover:text-white transition-colors"
                                                >
                                                    <Folder className="w-4 h-4" /> {t('nav.my_projects')}
                                                </button>
                                            )}
                                            {user.userType === 'college_member' && (
                                                <button
                                                    onClick={() => { navigate('/dashboard'); setIsProfileMenuOpen(false); }}
                                                    className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-text-muted hover:bg-zinc-900 hover:text-white transition-colors"
                                                >
                                                    <LayoutDashboard className="w-4 h-4" /> {t('nav.dashboard')}
                                                </button>
                                            )}
                                            {/* Only show Create Project for college members */}
                                            {user.userType === 'college_member' && (
                                                <button
                                                    onClick={() => { onOpenUpload(); setIsProfileMenuOpen(false); }}
                                                    className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-text-muted hover:bg-zinc-900 hover:text-white transition-colors"
                                                >
                                                    <Plus className="w-4 h-4" /> {t('nav.create_project')}
                                                </button>
                                            )}
                                        </div>

                                        <div className="border-t border-zinc-800 py-1">
                                            <button
                                                onClick={() => { onLogout(); setIsProfileMenuOpen(false); }}
                                                className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                                            >
                                                <LogOut className="w-4 h-4" /> {t('nav.logout')}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={() => onOpenAuth('login')}
                                    className="text-text-muted hover:text-white px-3 py-2 text-sm font-medium transition-colors"
                                >
                                    {t('nav.login')}
                                </button>
                                <button
                                    onClick={() => onOpenAuth('register')}
                                    className="bg-white text-black hover:bg-gray-200 px-4 py-2 rounded-md text-sm font-bold transition-all transform hover:scale-105"
                                >
                                    {t('nav.register')}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
