import React, { useState, useEffect } from 'react';
import {
  X, Lock, Mail, Loader2, ShieldCheck, AlertCircle, Info, Copy,
  Check, UserPlus, LogIn, Sparkles, Wand2, KeyRound, ArrowLeft,
  Smartphone, Github, User as UserIcon, BookOpen, GraduationCap,
  ArrowRight, Send
} from 'lucide-react';
import { UserRole, useAuth } from '../contexts/AuthContext';
import { getAppRedirectUrl } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup' | 'phone';
}

type AuthMode = 'signin' | 'signup' | 'phone' | 'magiclink' | 'forgot' | 'update_password';

export const AuthModal: React.FC<AuthModalProps> = ({ 
  isOpen, 
  onClose,
  initialMode = 'signin'
}) => {
  const {
    user,
    role,
    isAdmin,
    signIn,
    signUp,
    signInWithOAuth,
    sendPhoneOtp,
    verifyPhoneOtp,
    claimAdminRole,
    signInWithOtp,
    resetPasswordForEmail,
    updatePassword,
    isPasswordRecovery,
    setIsPasswordRecovery
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [accountType, setAccountType] = useState<UserRole>('user');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Phone OTP States
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState<'github' | 'google' | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  // Automatically switch to password recovery mode if recovery token is present
  useEffect(() => {
    if (isPasswordRecovery) {
      setMode('update_password');
    }
  }, [isPasswordRecovery]);

  // Sync initial mode
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      setInfoMessage(null);
      setSuccessMessage(null);
      setIsOtpSent(false);
    }
  }, [isOpen, initialMode]);

  // Timer countdown for phone OTP resend
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  if (!isOpen) return null;

  const currentRedirectUrl = getAppRedirectUrl();

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    setError(null);
    setInfoMessage(null);
    setSuccessMessage(null);
    setIsOtpSent(false);
  };

  const formatAuthError = (err: string, providerName?: string): string => {
    const errLower = err.toLowerCase();
    if (errLower.includes('unsupported provider') || errLower.includes('provider is not enabled') || errLower.includes('provider_disabled')) {
      const p = providerName || 'Social / Phone';
      return `${p} login is currently disabled in your Supabase project. To enable it: Go to Supabase Dashboard → Authentication → Providers → ${p}, toggle "Enable", and add your Client ID / Secret (or Twilio credentials for Phone). In the meantime, you can log in with Email & Password or Magic Link!`;
    }
    if (errLower.includes('email logins are disabled') || errLower.includes('email_provider_disabled')) {
      return 'Email logins are disabled in your Supabase project. Enable Email provider in Supabase Dashboard → Authentication → Providers → Email.';
    }
    if (errLower.includes('rate limit') || errLower.includes('rate_limit')) {
      return 'Supabase request rate limit reached. Please sign in directly with Email & Password, or try again in a few moments.';
    }
    if (errLower.includes('invalid login credentials')) {
      return 'Invalid email or password. If you do not have an account yet, switch to "Create Account" above.';
    }
    if (errLower.includes('user already registered')) {
      return 'An account with this email already exists. Switch to "Sign In" above.';
    }
    if (errLower.includes('failed to fetch') || errLower.includes('networkerror')) {
      return 'Network connection error. Please check your internet connection.';
    }
    return err;
  };

  // Handle OAuth Sign-in (GitHub / Google)
  const handleOAuthLogin = async (provider: 'github' | 'google') => {
    setError(null);
    setIsOAuthLoading(provider);
    const providerLabel = provider === 'github' ? 'GitHub' : 'Google';
    try {
      const res = await signInWithOAuth(provider);
      if (res.error) {
        setError(formatAuthError(res.error, providerLabel));
      }
    } catch (e: any) {
      setError(formatAuthError(e?.message || `Failed to sign in with ${providerLabel}`, providerLabel));
    } finally {
      setIsOAuthLoading(null);
    }
  };

  // Handle Phone OTP Submission
  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim() || phoneNumber.length < 8) {
      setError('Please enter a valid phone number with country code (e.g. +1234567890 or +919876543210).');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const res = await sendPhoneOtp(phoneNumber);
      if (res.error) {
        setError(formatAuthError(res.error, 'Phone (SMS)'));
      } else {
        setIsOtpSent(true);
        setOtpCountdown(60);
        setSuccessMessage(res.message || 'OTP verification code sent via SMS!');
      }
    } catch (err: any) {
      setError(formatAuthError(err?.message || 'Failed to send OTP code.', 'Phone (SMS)'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.length < 4) {
      setError('Please enter the verification code received via SMS.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const res = await verifyPhoneOtp(phoneNumber, otpCode);
      if (res.error) {
        setError(formatAuthError(res.error));
      } else {
        setSuccessMessage('Phone verified successfully! Signed in.');
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch (err: any) {
      setError(err?.message || 'Invalid or expired OTP code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Email & Password, Magic Link, Password Recovery
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    const trimmedEmail = email.trim();

    if (mode === 'signin') {
      const result = await signIn(trimmedEmail, password);
      setIsSubmitting(false);

      if (result.error) {
        setError(formatAuthError(result.error));
        return;
      }

      setSuccessMessage(`Welcome back! Signed in as ${trimmedEmail}`);
      setTimeout(() => {
        setEmail('');
        setPassword('');
        onClose();
      }, 900);
    } else if (mode === 'signup') {
      const result = await signUp(trimmedEmail, password, accountType, fullName);
      setIsSubmitting(false);

      if (result.error) {
        setError(formatAuthError(result.error));
        return;
      }

      if (result.requiresEmailConfirmation) {
        setSuccessMessage(
          `Account created for ${trimmedEmail}! A confirmation email was sent. After clicking it, you can access your personalized roadmap at ${currentRedirectUrl}.`
        );
      } else {
        setSuccessMessage(`Account created successfully! Signed in as ${accountType === 'admin' ? 'Admin' : 'Learner'}.`);
        setTimeout(() => {
          setEmail('');
          setPassword('');
          onClose();
        }, 1200);
      }
    } else if (mode === 'magiclink') {
      const result = await signInWithOtp(trimmedEmail);
      setIsSubmitting(false);

      if (result.error) {
        setError(formatAuthError(result.error));
        return;
      }

      setSuccessMessage(
        result.message || `Magic login link sent to ${trimmedEmail}! Check your inbox and click the link to log in directly.`
      );
    } else if (mode === 'forgot') {
      const result = await resetPasswordForEmail(trimmedEmail);
      setIsSubmitting(false);

      if (result.error) {
        setError(formatAuthError(result.error));
        return;
      }

      setSuccessMessage(
        result.message || `Password reset link sent to ${trimmedEmail}! Click the link in your email to choose a new password.`
      );
    } else if (mode === 'update_password') {
      if (password.length < 6) {
        setIsSubmitting(false);
        setError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        setIsSubmitting(false);
        setError('Passwords do not match. Please re-enter.');
        return;
      }

      const result = await updatePassword(password);
      setIsSubmitting(false);

      if (result.error) {
        setError(formatAuthError(result.error));
        return;
      }

      setIsPasswordRecovery(false);
      setSuccessMessage('Password updated successfully! You are now logged in.');
      setTimeout(() => {
        setPassword('');
        setConfirmPassword('');
        onClose();
      }, 1400);
    }
  };

  const handleClaimAdmin = async () => {
    setIsClaiming(true);
    const res = await claimAdminRole();
    setIsClaiming(false);
    if (res.success) {
      setSuccessMessage('Admin role granted successfully!');
      setInfoMessage(null);
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setError(res.message);
    }
  };

  const sqlCommand = `INSERT INTO public.profiles (id, email, role) SELECT id, email, 'admin' FROM auth.users WHERE email = '${email.trim() || user?.email || 'your-email@example.com'}' ON CONFLICT (id) DO UPDATE SET role = 'admin';`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlCommand);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 animate-fadeIn" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div className="w-full max-w-md my-auto rounded-3xl bg-[#0D1117]/95 border border-slate-750 shadow-2xl shadow-black/80 overflow-hidden font-sans backdrop-blur-2xl text-slate-200">
          
          {/* Header */}
          <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-[#0D1117] to-slate-950 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-cyan-500 text-slate-950 shadow-md shadow-amber-500/20 flex items-center justify-center font-black">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-white font-heading tracking-tight flex items-center gap-2">
                  <span>SageMap Portal</span>
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-mono font-black bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    AI / ML
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400">
                  {mode === 'update_password'
                    ? 'Set new account password'
                    : mode === 'forgot'
                      ? 'Reset your password via email'
                      : mode === 'phone'
                        ? 'Sign in using Phone OTP SMS'
                        : mode === 'magiclink'
                          ? 'Passwordless email login'
                          : mode === 'signup'
                            ? 'Create your free learner account'
                            : 'Sign in to sync bookmarks & roadmap progress'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          {mode !== 'update_password' && (
            <div className="flex border-b border-slate-800 bg-slate-950/70 p-1.5 gap-1 overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => handleModeChange('signin')}
                className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  mode === 'signin'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange('signup')}
                className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  mode === 'signup'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Sign Up</span>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange('phone')}
                className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  mode === 'phone'
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Phone OTP</span>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange('magiclink')}
                className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  mode === 'magiclink'
                    ? 'bg-purple-500 text-white shadow-md font-black'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Magic Link</span>
              </button>
            </div>
          )}

          <div className="p-5 sm:p-6 space-y-4">
            {/* 1-Click Social Logins (Google & GitHub) */}
            {(mode === 'signin' || mode === 'signup') && (
              <div className="space-y-2.5 pb-2">
                <div className="grid grid-cols-2 gap-2.5">
                  {/* GitHub OAuth */}
                  <button
                    type="button"
                    onClick={() => handleOAuthLogin('github')}
                    disabled={isOAuthLoading !== null}
                    className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-750 hover:border-slate-600 text-xs font-bold text-slate-200 flex items-center justify-center gap-2 transition-all shadow-sm group"
                  >
                    {isOAuthLoading === 'github' ? (
                      <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                    ) : (
                      <Github className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
                    )}
                    <span>GitHub</span>
                  </button>

                  {/* Google OAuth */}
                  <button
                    type="button"
                    onClick={() => handleOAuthLogin('google')}
                    disabled={isOAuthLoading !== null}
                    className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-750 hover:border-slate-600 text-xs font-bold text-slate-200 flex items-center justify-center gap-2 transition-all shadow-sm group"
                  >
                    {isOAuthLoading === 'google' ? (
                      <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                    ) : (
                      <svg className="w-4 h-4 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                        />
                      </svg>
                    )}
                    <span>Google</span>
                  </button>
                </div>

                {/* Divider */}
                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-slate-800"></div>
                  <span className="flex-shrink mx-3 text-[10.5px] font-mono text-slate-500 uppercase tracking-wider">
                    Or with email / password
                  </span>
                  <div className="flex-grow border-t border-slate-800"></div>
                </div>
              </div>
            )}

            {/* Phone OTP Verification Flow */}
            {mode === 'phone' ? (
              <div className="space-y-4">
                {!isOtpSent ? (
                  <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                        Phone Number (with Country Code)
                      </label>
                      <div className="relative">
                        <Smartphone className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          required
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="+1 555-0199 or +91 9876543210"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                        />
                      </div>
                      <p className="text-[10.5px] text-slate-500 mt-1">
                        We will send a 6-digit SMS verification code to this mobile number.
                      </p>
                    </div>

                    {error && (
                      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                        <p>{error}</p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-60 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Sending SMS OTP...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Send Verification OTP</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
                    <div className="p-3 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between text-xs text-cyan-200">
                      <div>
                        <span className="font-mono text-slate-400 text-[11px] block">Code sent to:</span>
                        <span className="font-bold text-white font-mono">{phoneNumber}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsOtpSent(false)}
                        className="text-[11px] text-cyan-400 hover:underline font-bold"
                      >
                        Change
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                        Enter 6-Digit OTP Code
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          placeholder="123456"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm font-black tracking-widest text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400 text-center font-mono"
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                        <p>{error}</p>
                      </div>
                    )}

                    {successMessage && (
                      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300">
                        <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                        <p>{successMessage}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs">
                      {otpCountdown > 0 ? (
                        <span className="text-[11px] text-slate-500 font-mono">
                          Resend code in {otpCountdown}s
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendPhoneOtp}
                          className="text-[11px] text-cyan-400 hover:underline font-bold"
                        >
                          Resend OTP SMS
                        </button>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-60 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Verifying OTP...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Verify & Sign In</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            ) : (
              /* Standard Email / Password / Magic Link Form */
              <form onSubmit={handleSubmit} className="space-y-3.5">
                
                {/* Account Type Selector for Sign Up */}
                {mode === 'signup' && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Account Type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAccountType('user')}
                        className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col gap-1 ${
                          accountType === 'user'
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 ring-1 ring-amber-500/30 shadow-md font-bold'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-current" />
                          <span className="text-xs font-bold">Learner / Customer</span>
                        </div>
                        <span className="text-[9.5px] text-slate-400 leading-tight">
                          Track bookmarks, take notes & progress
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAccountType('admin')}
                        className={`p-2.5 rounded-2xl border text-left transition-all flex flex-col gap-1 ${
                          accountType === 'admin'
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 ring-1 ring-amber-500/30 shadow-md font-bold'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-900'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-current" />
                          <span className="text-xs font-bold">Curriculum Admin</span>
                        </div>
                        <span className="text-[9.5px] text-slate-400 leading-tight">
                          Manage resources & feedback inbox
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Full Name for Sign Up */}
                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                      Your Name
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Alex Chen"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                )}

                {/* Email Field */}
                {mode !== 'update_password' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                )}

                {/* Password Field */}
                {(mode === 'signin' || mode === 'signup' || mode === 'update_password') && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                        {mode === 'update_password' ? 'New Password' : 'Password'}
                      </label>
                      {mode === 'signin' && (
                        <button
                          type="button"
                          onClick={() => handleModeChange('forgot')}
                          className="text-[11px] text-amber-400 hover:text-amber-300 font-medium transition-colors"
                        >
                          Forgot password?
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={mode === 'update_password' ? 'Minimum 6 characters' : '••••••••'}
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                )}

                {/* Confirm Password Field */}
                {mode === 'update_password' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wider">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat new password"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                )}

                {/* Error Message Display */}
                {error && (
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                    <div className="space-y-1">
                      <p>{error}</p>
                      {error.includes('Create Account') && mode === 'signin' && (
                        <button
                          type="button"
                          onClick={() => handleModeChange('signup')}
                          className="text-amber-400 hover:underline font-bold text-[11px] block mt-1"
                        >
                          → Switch to Create Account
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Success Message Display */}
                {successMessage && (
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300">
                    <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                    <div className="space-y-1">
                      <p>{successMessage}</p>
                      {(mode === 'magiclink' || mode === 'forgot') && (
                        <p className="text-[10.5px] text-emerald-400/80">
                          Redirect URL: <span className="underline font-mono">{currentRedirectUrl}</span>
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Info Message & Claim Admin Panel */}
                {infoMessage && (
                  <div className="space-y-2.5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <p>{infoMessage}</p>
                    </div>

                    <button
                      type="button"
                      onClick={handleClaimAdmin}
                      disabled={isClaiming}
                      className="w-full py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                    >
                      {isClaiming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      <span>Claim Admin Privileges</span>
                    </button>

                    <div className="mt-2 pt-2 border-t border-amber-500/20">
                      <span className="text-[11px] font-bold text-slate-400 block mb-1">Or run this in Supabase SQL Editor:</span>
                      <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[10px] text-amber-300">
                        <span className="truncate">{sqlCommand}</span>
                        <button
                          type="button"
                          onClick={handleCopySql}
                          className="p-1 rounded text-slate-400 hover:text-white shrink-0"
                          title="Copy SQL"
                        >
                          {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 disabled:opacity-60 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>
                        {mode === 'signin' && 'Signing In...'}
                        {mode === 'signup' && 'Creating Account...'}
                        {mode === 'magiclink' && 'Sending Magic Link...'}
                        {mode === 'forgot' && 'Sending Reset Link...'}
                        {mode === 'update_password' && 'Saving Password...'}
                      </span>
                    </>
                  ) : (
                    <span>
                      {mode === 'signin' && 'Sign In'}
                      {mode === 'signup' && (accountType === 'admin' ? 'Create Admin Account' : 'Create Learner Account')}
                      {mode === 'magiclink' && 'Send Magic Login Link'}
                      {mode === 'forgot' && 'Send Password Reset Link'}
                      {mode === 'update_password' && 'Save New Password'}
                    </span>
                  )}
                </button>

                {/* Back to Sign In button for Forgot & Update Password */}
                {(mode === 'forgot' || mode === 'update_password') && (
                  <button
                    type="button"
                    onClick={() => handleModeChange('signin')}
                    className="w-full py-1 text-center text-xs text-slate-400 hover:text-slate-200 font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Sign In</span>
                  </button>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
