import React, { useState, useEffect } from 'react';
import { 
  X, Lock, Mail, Loader2, ShieldCheck, AlertCircle, Info, Copy, 
  Check, UserPlus, LogIn, Sparkles, Wand2, KeyRound, ArrowLeft 
} from 'lucide-react';
import { UserRole, useAuth } from '../contexts/AuthContext';
import { getAppRedirectUrl } from '../lib/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: (email: string, password: string) => Promise<{ error: string | null; role?: UserRole | null }>;
  onSignUp?: (email: string, password: string) => Promise<{ error: string | null; role?: UserRole | null; requiresEmailConfirmation?: boolean }>;
}

type AuthMode = 'signin' | 'signup' | 'magiclink' | 'forgot' | 'update_password';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSignIn, onSignUp }) => {
  const { 
    user, 
    claimAdminRole, 
    signInWithOtp, 
    resetPasswordForEmail, 
    updatePassword, 
    isPasswordRecovery, 
    setIsPasswordRecovery 
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  // Automatically switch to password recovery mode if recovery token is present
  useEffect(() => {
    if (isPasswordRecovery) {
      setMode('update_password');
    }
  }, [isPasswordRecovery]);

  if (!isOpen) return null;

  const currentRedirectUrl = getAppRedirectUrl();

  const handleModeChange = (newMode: AuthMode) => {
    setMode(newMode);
    setError(null);
    setInfoMessage(null);
    setSuccessMessage(null);
  };

  const formatAuthError = (err: string): string => {
    const errLower = err.toLowerCase();
    if (errLower.includes('rate limit') || errLower.includes('rate_limit')) {
      return 'Supabase email rate limit reached (free tier allows ~3-4 emails/hr). Please sign in directly with Email & Password below, or set a password in Supabase Dashboard > Authentication > Users.';
    }
    if (errLower.includes('invalid login credentials')) {
      return 'Invalid email or password. If you haven\'t created this account yet, switch to "Create Admin" above.';
    }
    if (errLower.includes('failed to fetch') || errLower.includes('networkerror')) {
      return 'Network connection error. Please ensure the latest code is deployed to Vercel and check your connection.';
    }
    return err;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    const trimmedEmail = email.trim();

    if (mode === 'signin') {
      const result = await onSignIn(trimmedEmail, password);
      setIsSubmitting(false);

      if (result.error) {
        setError(formatAuthError(result.error));
        return;
      }

      if (result.role !== 'admin') {
        setInfoMessage(
          `Signed in as ${trimmedEmail}, but this account currently has '${result.role || 'user'}' role. Click "Claim Admin Privileges" below or run the SQL command.`
        );
        return;
      }

      setEmail('');
      setPassword('');
      onClose();
    } else if (mode === 'signup') {
      if (!onSignUp) {
        setIsSubmitting(false);
        setError('Sign up is not configured.');
        return;
      }

      const result = await onSignUp(trimmedEmail, password);
      setIsSubmitting(false);

      if (result.error) {
        setError(formatAuthError(result.error));
        return;
      }

      if (result.requiresEmailConfirmation) {
        setSuccessMessage(
          `Account created for ${trimmedEmail}! A confirmation email was sent. After clicking it, you will be redirected to ${currentRedirectUrl}.`
        );
      } else {
        setSuccessMessage(`Account created successfully with Admin role! You are now signed in.`);
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
      setSuccessMessage('Password updated successfully! You can now continue as Admin.');
      setTimeout(() => {
        setPassword('');
        setConfirmPassword('');
        onClose();
      }, 1500);
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
      <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 animate-fadeIn" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl bg-[#0D1117] border border-slate-700 shadow-2xl overflow-hidden font-sans">
          {/* Header */}
          <div className="p-5 border-b border-slate-800 bg-[#090A0F] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-black text-white">SageMap Admin Portal</h2>
                <p className="text-[11px] text-slate-400">
                  {mode === 'update_password'
                    ? 'Set new admin password'
                    : mode === 'forgot'
                    ? 'Reset account password'
                    : mode === 'magiclink'
                    ? 'One-click passwordless login'
                    : 'Cloud database content management'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mode Switcher Tabs for Main Flows */}
          {mode !== 'update_password' && (
            <div className="flex border-b border-slate-800 bg-slate-950/60 p-1">
              <button
                type="button"
                onClick={() => handleModeChange('signin')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'signin'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange('signup')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'signup'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Create Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleModeChange('magiclink')}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'magiclink'
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Magic Link</span>
              </button>
            </div>
          )}

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Email Field (for signin, signup, magiclink, forgot) */}
            {mode !== 'update_password' && (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Admin Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-medium text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            )}

            {/* Password Field (for signin, signup, update_password) */}
            {(mode === 'signin' || mode === 'signup' || mode === 'update_password') && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
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

            {/* Confirm Password Field (for update_password) */}
            {mode === 'update_password' && (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
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
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p>{error}</p>
                  {error.includes('Create Admin Account') && mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => handleModeChange('signup')}
                      className="text-amber-400 hover:underline font-bold text-[11px] block mt-1"
                    >
                      → Switch to Create Admin Account
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
                    <p className="text-[11px] text-emerald-400/80">
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
                  <span>Claim Admin Privileges Directly</span>
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
                    {mode === 'signin' && 'Authenticating...'}
                    {mode === 'signup' && 'Creating Account...'}
                    {mode === 'magiclink' && 'Sending Magic Link...'}
                    {mode === 'forgot' && 'Sending Reset Link...'}
                    {mode === 'update_password' && 'Updating Password...'}
                  </span>
                </>
              ) : (
                <span>
                  {mode === 'signin' && 'Sign In as Admin'}
                  {mode === 'signup' && 'Create Admin Account'}
                  {mode === 'magiclink' && 'Send Magic Login Link'}
                  {mode === 'forgot' && 'Send Password Reset Link'}
                  {mode === 'update_password' && 'Save New Password'}
                </span>
              )}
            </button>

            {/* Secondary Navigation Links */}
            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => handleModeChange('signin')}
                className="w-full py-1 text-center text-xs text-slate-400 hover:text-slate-200 font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Sign In</span>
              </button>
            )}

            {mode === 'update_password' && (
              <button
                type="button"
                onClick={() => {
                  setIsPasswordRecovery(false);
                  handleModeChange('signin');
                }}
                className="w-full py-1 text-center text-xs text-slate-400 hover:text-slate-200 font-medium flex items-center justify-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Cancel and return to Sign In</span>
              </button>
            )}
          </form>
        </div>
      </div>
    </>
  );
};
