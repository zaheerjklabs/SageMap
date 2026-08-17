import React, { useState } from 'react';
import { X, Lock, Mail, Loader2, ShieldCheck, AlertCircle, Info, Copy, Check, UserPlus, LogIn, Sparkles } from 'lucide-react';
import { UserRole, useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: (email: string, password: string) => Promise<{ error: string | null; role?: UserRole | null }>;
  onSignUp?: (email: string, password: string) => Promise<{ error: string | null; role?: UserRole | null; requiresEmailConfirmation?: boolean }>;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSignIn, onSignUp }) => {
  const { user, role, claimAdminRole } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    if (mode === 'signin') {
      const result = await onSignIn(email.trim(), password);
      setIsSubmitting(false);

      if (result.error) {
        if (result.error.toLowerCase().includes('invalid login credentials')) {
          setError(
            'Invalid email or password. If you haven\'t created this account in Supabase yet, click the "Create Admin Account" tab above.'
          );
        } else {
          setError(result.error);
        }
        return;
      }

      if (result.role !== 'admin') {
        setInfoMessage(
          `Signed in as ${email}, but this account currently has the '${result.role || 'user'}' role. Click "Claim Admin Privileges" below or run the SQL command in Supabase.`
        );
        return;
      }

      setEmail('');
      setPassword('');
      onClose();
    } else {
      // Sign up mode
      if (!onSignUp) {
        setIsSubmitting(false);
        setError('Sign up is not configured.');
        return;
      }

      const result = await onSignUp(email.trim(), password);
      setIsSubmitting(false);

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.requiresEmailConfirmation) {
        setSuccessMessage(
          `Account created for ${email}! Please check your email to confirm registration, or disable email confirmation in your Supabase Auth settings to log in immediately.`
        );
      } else {
        setSuccessMessage(`Account created successfully with Admin role! You are now signed in.`);
        setTimeout(() => {
          setEmail('');
          setPassword('');
          onClose();
        }, 1200);
      }
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
                <p className="text-[11px] text-slate-400">Cloud database content management</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex border-b border-slate-800 bg-slate-950/60 p-1">
            <button
              type="button"
              onClick={() => {
                setMode('signin');
                setError(null);
                setInfoMessage(null);
                setSuccessMessage(null);
              }}
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
              onClick={() => {
                setMode('signup');
                setError(null);
                setInfoMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                mode === 'signup'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create Admin Account</span>
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
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

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p>{error}</p>
                  {error.includes('Create Admin Account') && mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => setMode('signup')}
                      className="text-amber-400 hover:underline font-bold text-[11px] block mt-1"
                    >
                      → Switch to Create Account
                    </button>
                  )}
                </div>
              </div>
            )}

            {successMessage && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300">
                <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <p>{successMessage}</p>
              </div>
            )}

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

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 disabled:opacity-60 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{mode === 'signin' ? 'Authenticating...' : 'Creating Account...'}</span>
                </>
              ) : (
                <span>{mode === 'signin' ? 'Sign In as Admin' : 'Create Admin Account'}</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};
