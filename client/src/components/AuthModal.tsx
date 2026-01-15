import { useState, useEffect } from 'react';
import { X, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { api } from '../lib/api';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLoginSuccess: (token: string, user: any) => void;
    initialView?: 'login' | 'register';
}

import { useLanguage } from '../contexts/LanguageContext';

const AuthModal = ({ isOpen, onClose, onLoginSuccess, initialView = 'login' }: AuthModalProps) => {
    const { t } = useLanguage();
    const [isLoginView, setIsLoginView] = useState(initialView === 'login');
    const [isOTP, setIsOTP] = useState(false);
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');

    // Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [agreed, setAgreed] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsLoginView(initialView === 'login');
            setIsOTP(false);
            setOtp('');
            setError('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setDisplayName('');
            setAgreed(false);
            setShowPassword(false);
            setShowConfirmPassword(false);
        }
    }, [isOpen, initialView]);

    // Reset form when switching views
    const toggleView = () => {
        setIsLoginView(!isLoginView);
        setIsOTP(false);
        setError('');
        setOtp('');
        // Keep email/password/name if switching back? Or reset?
        // Let's reset for safety/cleanness
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setDisplayName('');
        setAgreed(false);
        setShowPassword(false);
        setShowConfirmPassword(false);
    };

    const handleSubmit = async () => {
        setError('');
        try {
            if (isOTP) {
                const res = await api.post('/auth/verify', { email, otp });
                onLoginSuccess(res.token, res.user);
                onClose();
                return;
            }

            if (isLoginView) {
                const res = await api.post('/auth/login', { email, password });
                onLoginSuccess(res.token, res.user);
            } else {
                if (password !== confirmPassword) {
                    setError(t('auth.password_mismatch'));
                    return;
                }
                if (!agreed) {
                    setError(t('auth.accept_terms_error'));
                    return;
                }
                const res = await api.post('/auth/register', { email, password, displayName });
                if (res.requireOtp) {
                    setIsOTP(true);
                    setError(''); // Clear any previous errors
                    alert(`Verification code sent to ${res.email}`);
                    return; // Don't close, show OTP input
                }
                onLoginSuccess(res.token, res.user);
            }
            if (!isOTP) onClose(); // Only close if not switching to OTP
        } catch (err: any) {
            setError(err.message || t('auth.auth_failed'));
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        try {
            const res = await api.post('/auth/google', { credential: credentialResponse.credential });
            onLoginSuccess(res.token, res.user);
            onClose();
        } catch (err: any) {
            setError(err.message || t('auth.google_login_failed'));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-md p-8 shadow-2xl overflow-hidden animate-modal-in">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>

                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-1">
                                {isOTP ? 'Verify Email' : isLoginView ? t('auth.login_title') : t('auth.register_title')}
                            </h2>
                            <p className="text-gray-500 text-sm">
                                {isOTP ? `Enter the code sent to ${email}` : isLoginView ? t('auth.login_subtitle') : t('auth.register_subtitle')}
                            </p>
                        </div>
                        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
                        {isOTP ? (
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Verification Code</label>
                                <input
                                    type="text"
                                    className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-white focus:ring-1 focus:ring-white outline-none transition-all text-center tracking-widest text-lg"
                                    placeholder="00000"
                                    value={otp}
                                    onChange={e => setOtp(e.target.value)}
                                    maxLength={5}
                                    required
                                />
                                <div className="text-center mt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsOTP(false)}
                                        className="text-xs text-gray-500 hover:text-white underline"
                                    >
                                        Change Email / Back
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {!isLoginView && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">{t('auth.username_label')}</label>
                                        <input
                                            type="text"
                                            className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-white focus:ring-1 focus:ring-white outline-none transition-all"
                                            placeholder={t('auth.username_placeholder')}
                                            value={displayName}
                                            onChange={e => setDisplayName(e.target.value)}
                                            required
                                        />
                                    </div>
                                )}
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">
                                        {isLoginView ? t('auth.login_input_label') : t('auth.email_label')}
                                    </label>
                                    <input
                                        type={isLoginView ? 'text' : 'email'}
                                        className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-white focus:ring-1 focus:ring-white outline-none transition-all"
                                        placeholder={isLoginView ? t('auth.login_input_placeholder') : t('auth.email_placeholder')}
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">{t('auth.password_label')}</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-white focus:ring-1 focus:ring-white outline-none transition-all pr-10"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                {!isLoginView && (
                                    <>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-400 mb-1">{t('auth.confirm_password_label')}</label>
                                            <div className="relative">
                                                <input
                                                    type={showConfirmPassword ? 'text' : 'password'}
                                                    className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-white focus:ring-1 focus:ring-white outline-none transition-all pr-10"
                                                    placeholder="••••••••"
                                                    value={confirmPassword}
                                                    onChange={e => setConfirmPassword(e.target.value)}
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                                >
                                                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-2 pt-2">
                                            <input
                                                type="checkbox"
                                                id="terms"
                                                className="mt-1"
                                                checked={agreed}
                                                onChange={e => setAgreed(e.target.checked)}
                                            />
                                            <label htmlFor="terms" className="text-xs text-gray-400 cursor-pointer select-none">
                                                {t('auth.terms_agree')} <span className="text-white hover:underline">{t('auth.terms_service')}</span> {t('auth.or')} <span className="text-white hover:underline">{t('auth.privacy_policy')}</span>
                                            </label>
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                        {error && <p className="text-red-500 text-xs text-center">{error}</p>}

                        <button
                            type="submit"
                            className="w-full bg-white text-black font-bold py-2.5 rounded-lg hover:bg-gray-200 transition-all transform active:scale-95 flex items-center justify-center gap-2"
                        >
                            {isLoginView ? t('auth.login_button') : t('auth.register_button')} <ChevronRight className="w-4 h-4" />
                        </button>
                    </form>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-zinc-800"></div>
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-zinc-950 px-2 text-gray-500">{t('auth.or')}</span>
                        </div>
                    </div>

                    <div className="flex justify-center">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => setError('Google Login Failed')}
                            theme="filled_black"
                            shape="circle"
                            text="continue_with"
                            width="250"
                        />
                    </div>

                    <div className="mt-6 text-center text-sm text-gray-500">
                        {isLoginView ? t('auth.no_account') : t('auth.has_account')}
                        <button
                            type="button"
                            onClick={toggleView}
                            className="text-white underline hover:text-gray-300"
                        >
                            {isLoginView ? t('auth.register_button') : t('auth.login_button')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
