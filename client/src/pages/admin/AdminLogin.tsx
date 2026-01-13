import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock } from 'lucide-react';
import { api } from '../../lib/api';

const AdminLogin = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Build-in security: Redirect if not accessed via secret gesture
        // Check both location state (navigation) and URL param (new tab)
        const params = new URLSearchParams(location.search);
        // Fix: Also check for 'from' state which indicates a redirect from ProtectedAdminRoute
        const hasAccess = location.state?.accessGranted || params.get('access') === 'true' || location.state?.from;

        if (!hasAccess) {
            navigate('/', { replace: true });
        }
    }, [location, navigate]);

    // Helper to check valid access for rendering
    const checkAccess = () => {
        const params = new URLSearchParams(location.search);
        // Allow if explicit access grant OR if redirected from a protected route (user intent was valid)
        return location.state?.accessGranted || params.get('access') === 'true' || location.state?.from;
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const data = await api.adminLogin({ email, password });

            // Store token in Admin-specific key
            localStorage.setItem('adminToken', data.token);

            // Force a hard redirect to ensure clean state and full auth check
            // this bypasses any SPA state race conditions
            window.location.href = '/admin/dashboard';
        } catch (err: any) {
            setError(err.message || 'Invalid credentials');
            setLoading(false);
        }
    };

    if (!checkAccess()) {
        return null; // Don't render anything while redirecting
    }

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-zinc-900 border border-red-900/30 rounded-2xl p-8 shadow-[0_0_50px_rgba(220,38,38,0.1)] animate-fade-in">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                        <ShieldCheck className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-widest uppercase">พื้นที่สำหรับผู้ดูแลระบบ</h1>
                    <p className="text-red-400/60 text-sm mt-2 font-mono">เฉพาะเจ้าหน้าที่ที่ได้รับอนุญาตเท่านั้น</p>
                </div>

                {error && (
                    <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-xs font-mono text-zinc-500 mb-2 uppercase">อีเมลผู้ดูแล</label>
                        <div className="relative">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-black/50 border border-zinc-800 rounded-lg px-4 py-3 pl-10 text-white focus:outline-none focus:border-red-500/50 transition-colors"
                                placeholder="กรอกอีเมลผู้ดูแล"
                                required
                            />
                            <ShieldCheck className="w-4 h-4 text-zinc-600 absolute left-3 top-3.5" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-mono text-zinc-500 mb-2 uppercase">รหัสผ่าน</label>
                        <div className="relative">
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black/50 border border-zinc-800 rounded-lg px-4 py-3 pl-10 text-white focus:outline-none focus:border-red-500/50 transition-colors"
                                placeholder="กรอกรหัสผ่าน"
                                required
                            />
                            <Lock className="w-4 h-4 text-zinc-600 absolute left-3 top-3.5" />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 text-white font-bold py-3 rounded-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border border-red-700/30 shadow-lg shadow-red-900/20"
                    >
                        {loading ? 'กำลังยืนยันตัวตน...' : 'เข้าสู่แดชบอร์ด'}
                    </button>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="text-zinc-600 hover:text-zinc-400 text-xs font-mono uppercase tracking-widest transition-colors"
                        >
                            กลับสู่หน้าหลัก
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
