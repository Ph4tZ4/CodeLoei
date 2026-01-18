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
    const [view, setView] = useState<'login' | 'register' | 'forgot'>(initialView === 'login' ? 'login' : 'register');
    const [isOTP, setIsOTP] = useState(false); // For registration OTP
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');

    // Forgot Password State
    const [forgotStep, setForgotStep] = useState<'email' | 'otp' | 'reset'>('email');
    const [resetEmail, setResetEmail] = useState('');
    const [resetOtp, setResetOtp] = useState('');
    const [newResetPassword, setNewResetPassword] = useState('');
    const [confirmResetPassword, setConfirmResetPassword] = useState('');

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
            setView(initialView === 'login' ? 'login' : 'register');
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

            // Reset Forgot Password State
            setForgotStep('email');
            setResetEmail('');
            setResetOtp('');
            setNewResetPassword('');
            setConfirmResetPassword('');
        }
    }, [isOpen, initialView]);

    const toggleView = (newView: 'login' | 'register' | 'forgot') => {
        setView(newView);
        setError('');
        // Optional: clear forms
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

            if (view === 'login') {
                const res = await api.post('/auth/login', { email, password });
                onLoginSuccess(res.token, res.user);
            } else if (view === 'register') {
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
                    setError('');
                    alert(`Verification code sent to ${res.email}`);
                    return;
                }
                onLoginSuccess(res.token, res.user);
            }
            if (!isOTP) onClose();
        } catch (err: any) {
            setError(err.message || t('auth.auth_failed'));
        }
    };

    const handleForgotSubmit = async () => {
        setError('');
        try {
            if (forgotStep === 'email') {
                if (!resetEmail) {
                    setError(t('auth.email_required'));
                    return;
                }
                await api.forgotPassword(resetEmail);
                setForgotStep('otp');
                // alert(`OTP sent to ${resetEmail}`);
            } else if (forgotStep === 'otp') {
                if (!resetOtp || resetOtp.length !== 5) {
                    setError(t('auth.invalid_otp_error'));
                    return;
                }
                const res = await api.verifyPasswordOTP(resetEmail, resetOtp);
                if (res.isValid) {
                    setForgotStep('reset');
                }
            } else if (forgotStep === 'reset') {
                if (newResetPassword.length < 6) {
                    setError(t('auth.password_length_error'));
                    return;
                }
                if (newResetPassword !== confirmResetPassword) {
                    setError(t('auth.password_mismatch'));
                    return;
                }
                await api.resetPassword({
                    email: resetEmail,
                    otp: resetOtp,
                    newPassword: newResetPassword
                });
                alert(t('auth.reset_success_alert'));
                setView('login');
                setForgotStep('email'); // Reset for next time
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred');
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
                                {view === 'forgot'
                                    ? (forgotStep === 'email' ? t('auth.reset_password_title') : forgotStep === 'otp' ? t('auth.verify_otp_title') : t('auth.new_password_title'))
                                    : isOTP
                                        ? t('auth.verify_email_title')
                                        : view === 'login' ? t('auth.login_title') : t('auth.register_title')}
                            </h2>
                            <p className="text-gray-500 text-sm">
                                {view === 'forgot'
                                    ? (forgotStep === 'email' ? t('auth.enter_email_subtitle') : forgotStep === 'otp' ? `${t('auth.enter_otp_subtitle')} ${resetEmail}` : t('auth.set_new_password_subtitle'))
                                    : isOTP
                                        ? `${t('auth.enter_otp_subtitle')} ${email}`
                                        : view === 'login' ? t('auth.login_subtitle') : t('auth.register_subtitle')}
                            </p>
                        </div>
                        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {view === 'forgot' ? (
                        /* Forgot Password Flow */
                        <form onSubmit={(e) => { e.preventDefault(); handleForgotSubmit(); }} className="space-y-4">
                            {forgotStep === 'email' && (
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">{t('auth.email_label')}</label>
                                    <input
                                        type="email"
                                        className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-white focus:ring-1 focus:ring-white outline-none transition-all"
                                        placeholder={t('auth.email_placeholder')}
                                        value={resetEmail}
                                        onChange={e => setResetEmail(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>
                            )}

                            {forgotStep === 'otp' && (
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">{t('auth.otp_label')}</label>
                                    <input
                                        type="text"
                                        className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-white focus:ring-1 focus:ring-white outline-none transition-all text-center tracking-widest text-lg"
                                        placeholder="00000"
                                        value={resetOtp}
                                        onChange={e => setResetOtp(e.target.value)}
                                        maxLength={5}
                                        required
                                        autoFocus
                                    />
                                    <div className="text-center mt-2">
                                        <button
                                            type="button"
                                            onClick={() => setForgotStep('email')}
                                            className="text-xs text-gray-500 hover:text-white underline"
                                        >
                                            {t('auth.change_email')}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {forgotStep === 'reset' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">{t('auth.new_password_label')}</label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-white focus:ring-1 focus:ring-white outline-none transition-all pr-10"
                                                placeholder="••••••••"
                                                value={newResetPassword}
                                                onChange={e => setNewResetPassword(e.target.value)}
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
                                    <div>
                                        <label className="block text-xs font-medium text-gray-400 mb-1">{t('auth.confirm_new_password_label')}</label>
                                        <div className="relative">
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-white focus:ring-1 focus:ring-white outline-none transition-all pr-10"
                                                placeholder="••••••••"
                                                value={confirmResetPassword}
                                                onChange={e => setConfirmResetPassword(e.target.value)}
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
                                </>
                            )}

                            {error && <p className="text-red-500 text-xs text-center">{error}</p>}

                            <button
                                type="submit"
                                className="w-full bg-white text-black font-bold py-2.5 rounded-lg hover:bg-gray-200 transition-all transform active:scale-95 flex items-center justify-center gap-2"
                            >
                                {forgotStep === 'email' ? t('auth.send_otp_btn') : forgotStep === 'otp' ? t('auth.verify_otp_btn') : t('auth.reset_password_btn')} <ChevronRight className="w-4 h-4" />
                            </button>

                            <div className="mt-4 text-center">
                                <button
                                    type="button"
                                    onClick={() => toggleView('login')}
                                    className="text-xs text-gray-500 hover:text-white underline"
                                >
                                    {t('auth.back_to_login')}
                                </button>
                            </div>
                        </form>
                    ) : (
                        /* Login / Register Flow */
                        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4">
                            {isOTP ? (
                                <div>
                                    <label className="block text-xs font-medium text-gray-400 mb-1">{t('auth.otp_label')}</label>
                                    <input
                                        type="text"
                                        className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-white focus:ring-1 focus:ring-white outline-none transition-all text-center tracking-widest text-lg"
                                        placeholder="00000"
                                        value={otp}
                                        onChange={e => setOtp(e.target.value)}
                                        maxLength={5}
                                        required
                                        autoFocus
                                    />
                                    <div className="text-center mt-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsOTP(false)}
                                            className="text-xs text-gray-500 hover:text-white underline"
                                        >
                                            {t('auth.change_email')} / {t('auth.back_to_login')}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {view === 'register' && (
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
                                            {view === 'login' ? t('auth.login_input_label') : t('auth.email_label')}
                                        </label>
                                        <input
                                            type={view === 'login' ? 'text' : 'email'}
                                            className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-white focus:border-white focus:ring-1 focus:ring-white outline-none transition-all"
                                            placeholder={view === 'login' ? t('auth.login_input_placeholder') : t('auth.email_placeholder')}
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="block text-xs font-medium text-gray-400">{t('auth.password_label')}</label>
                                            {view === 'login' && (
                                                <button
                                                    type="button"
                                                    onClick={() => toggleView('forgot')}
                                                    className="text-xs text-blue-400 hover:text-blue-300 hover:underline"
                                                >
                                                    {t('auth.forgot_password_link')}
                                                </button>
                                            )}
                                        </div>
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

                                    {view === 'register' && (
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
                                {view === 'login' ? t('auth.login_button') : t('auth.register_button')} <ChevronRight className="w-4 h-4" />
                            </button>
                        </form>
                    )}

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
                        {view === 'login' ? t('auth.no_account') : t('auth.has_account')}
                        <button
                            type="button"
                            onClick={() => toggleView(view === 'login' ? 'register' : 'login')}
                            className="text-white underline hover:text-gray-300 ml-1"
                        >
                            {view === 'login' ? t('auth.register_button') : t('auth.login_button')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
