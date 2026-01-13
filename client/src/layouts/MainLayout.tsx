import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { X } from 'lucide-react';
import TechBackground from '../components/TechBackground';

interface MainLayoutProps {
    user: any;
    onLogout: () => void;
    onOpenUpload: () => void;
    context?: any;
}

const MainLayout = ({ user, onLogout, onOpenUpload, context }: MainLayoutProps) => {
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-zinc-900/40 via-black to-black -z-10"></div>
            <TechBackground />

            <Navbar
                user={user}
                onLogout={onLogout}
                onOpenAuth={() => { }}
                onToggleMenu={() => setMobileMenuOpen(true)}
                onOpenUpload={onOpenUpload}
            />

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 z-[60] lg:hidden">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
                    <div className="absolute top-0 left-0 w-64 h-full bg-zinc-950 border-r border-zinc-800 shadow-2xl animate-fade-in flex flex-col">
                        <div className="flex justify-end p-4">
                            <button onClick={() => setMobileMenuOpen(false)} className="text-gray-500 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <Sidebar user={user} onCloseMobile={() => setMobileMenuOpen(false)} />
                    </div>
                </div>
            )}

            <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">

                    {/* Desktop Sticky Sidebar */}
                    {user && (
                        <aside className="hidden lg:flex lg:col-span-1 lg:sticky lg:top-24 bg-zinc-900/50 border border-zinc-800 rounded-lg backdrop-blur-sm animate-fade-in flex-col h-[calc(100vh-8rem)]">
                            <Sidebar user={user} />
                        </aside>
                    )}

                    {/* Main Content Area */}
                    <div className={`${user ? 'lg:col-span-3' : 'lg:col-span-4'} min-h-[600px]`}>
                        <Outlet context={{ user, ...context }} />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
