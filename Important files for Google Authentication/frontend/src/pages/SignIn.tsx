import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuthStore } from '../store/useAuthStore';
import { Loader2, Eye, EyeOff } from 'lucide-react';

const SignIn = () => {
    const navigate = useNavigate();
    const { login, googleLogin, isAuthenticated } = useAuthStore();

    const [formData, setFormData] = useState({ identifier: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const normalizeError = (err: any): string => {
        if (typeof err === 'string') return err;
        if (err.response && err.response.data && err.response.data.message) return err.response.data.message;
        if (err.response && err.response.data && err.response.data.msg) return err.response.data.msg;
        if (err.message) return err.message;
        return 'An error occurred';
    };

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        try {
            await login(formData);
            setMessage({ text: 'เข้าสู่ระบบสำเร็จ!', type: 'success' });
            setTimeout(() => navigate('/dashboard'), 1000);
        } catch (err: any) {
            setMessage({ text: normalizeError(err), type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const googleLoginAction = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setLoading(true);
            setMessage(null);
            try {
                // Use id_token flow if possible, or access_token depending on backend
                // Legacy used access_token. Let's see prompt for `googleLogin`.
                // `googleLogin` store action expects idToken/accessToken string.
                // React OAuth2 useGoogleLogin returns codeResponse if flow='auth-code' or TokenResponse (access_token) if flow='implicit' (default).
                // Our backend 'verify-google-token' expects id_token if we used legacy verify, but 'google' route uses access_token.
                // Let's pass access_token.
                await googleLogin(tokenResponse.access_token);
                setMessage({ text: 'เข้าสู่ระบบด้วย Google สำเร็จ!', type: 'success' });
                setTimeout(() => navigate('/dashboard'), 1000);
            } catch (err: any) {
                setMessage({ text: normalizeError(err), type: 'error' });
            } finally {
                setLoading(false);
            }
        },
        onError: () => setMessage({ text: 'Google Login Failed', type: 'error' }),
    });

    return (
        <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
                <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-white/5 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
                <div className="absolute -top-40 -left-20 w-80 h-80 bg-white/5 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
            </div>

            <div className="relative z-10 bg-black rounded-3xl p-8 w-full max-w-lg mx-4 shadow-2xl border border-gray-800 animate-fade-in-slide-up">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">ยินดีต้อนรับกลับ</h1>
                    <p className="text-gray-400">เข้าสู่ระบบเพื่อดำเนินการต่อ</p>
                </div>

                {message && (
                    <div className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'error' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'bg-green-500/20 text-green-300 border border-green-500/30'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSignIn} className="space-y-6">
                    <div>
                        <input
                            id="identifier"
                            type="text"
                            placeholder="อีเมลหรือชื่อผู้ใช้"
                            value={formData.identifier}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-black border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-200"
                            required
                        />
                        <p className="text-xs text-gray-400 mt-1">สามารถใช้อีเมลหรือชื่อผู้ใช้เพื่อเข้าสู่ระบบ</p>
                    </div>

                    <div className="relative">
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="รหัสผ่าน"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-black border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all duration-200 pr-12"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        >
                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-white text-black font-semibold py-3 px-6 rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-black transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" />
                                กำลังเข้าสู่ระบบ...
                            </span>
                        ) : (
                            <span>เข้าสู่ระบบ</span>
                        )}
                    </button>
                </form>

                <div className="relative my-8">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-black text-gray-400">หรือดำเนินการต่อด้วย</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={() => googleLoginAction()}
                        disabled={loading}
                        className="w-full flex items-center justify-center px-4 py-3 bg-black border border-gray-600 rounded-xl text-white hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        {loading ? 'กำลังดำเนินการ...' : 'ดำเนินการต่อด้วย Google'}
                    </button>
                </div>

                <div className="text-center mt-8">
                    <p className="text-gray-400">
                        ยังไม่มีบัญชี? {' '}
                        <Link to="/signup" className="text-white hover:text-gray-300 font-medium transition-colors underline">
                            สมัครสมาชิก
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SignIn;
