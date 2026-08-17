import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export type UserRole = 'admin' | 'user';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  role: UserRole | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null; role?: UserRole | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null; role?: UserRole | null; requiresEmailConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<UserRole | null>;
  claimAdminRole: () => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchUserRole(user: User): Promise<UserRole> {
  // 1. Check user metadata directly
  const metaRole = (user.app_metadata?.role || user.user_metadata?.role) as string | undefined;
  if (metaRole === 'admin') {
    return 'admin';
  }

  // 2. Query public.profiles
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (!error && data?.role) {
      return data.role as UserRole;
    }

    // 3. If profile doesn't exist yet, insert with 'admin' (for easy first admin setup)
    if (!data) {
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({ id: user.id, email: user.email, role: 'admin' })
        .select('role')
        .maybeSingle();

      if (!insertError && newProfile?.role) {
        return newProfile.role as UserRole;
      }
    }
  } catch (err) {
    console.error('Error determining user role:', err);
  }

  return 'user';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(() => {
    try {
      const cached = localStorage.getItem('sagemap_admin_role_cache');
      return cached === 'admin' ? 'admin' : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadRole = useCallback(async (currentUser: User): Promise<UserRole> => {
    const userRole = await fetchUserRole(currentUser);
    setRole(userRole);
    try {
      if (userRole === 'admin') {
        localStorage.setItem('sagemap_admin_role_cache', 'admin');
      } else {
        localStorage.removeItem('sagemap_admin_role_cache');
      }
    } catch {
      // ignore storage errors
    }
    return userRole;
  }, []);

  const refreshRole = useCallback(async (): Promise<UserRole | null> => {
    if (!user) return null;
    return await loadRole(user);
  }, [user, loadRole]);

  const claimAdminRole = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    if (!user) {
      return { success: false, message: 'You must be logged in to claim admin privileges.' };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, email: user.email, role: 'admin' }, { onConflict: 'id' });

      if (error) {
        return {
          success: false,
          message: `Could not update role directly (${error.message}). Run the SQL script in Supabase SQL editor.`
        };
      }

      setRole('admin');
      localStorage.setItem('sagemap_admin_role_cache', 'admin');
      return { success: true, message: 'Admin role claimed successfully!' };
    } catch (e) {
      const err = e instanceof Error ? e.message : 'Unknown error';
      return { success: false, message: err };
    }
  }, [user]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!isMounted) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        loadRole(currentSession.user).finally(() => {
          if (isMounted) setIsLoading(false);
        });
      } else {
        setRole(null);
        localStorage.removeItem('sagemap_admin_role_cache');
        setIsLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        if (!isMounted) return;
        setSession(nextSession);
        setUser(nextSession?.user ?? null);

        if (nextSession?.user) {
          await loadRole(nextSession.user);
        } else {
          setRole(null);
          localStorage.removeItem('sagemap_admin_role_cache');
        }
        setIsLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadRole]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: error.message };
    }
    if (data.user) {
      const userRole = await loadRole(data.user);
      return { error: null, role: userRole };
    }
    return { error: null };
  }, [loadRole]);

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      return { error: error.message };
    }

    if (data.user) {
      // Auto-insert profile as admin
      await supabase
        .from('profiles')
        .upsert({ id: data.user.id, email: data.user.email, role: 'admin' }, { onConflict: 'id' });

      // If user session is immediate (email confirm disabled in Supabase)
      if (data.session) {
        const userRole = await loadRole(data.user);
        return { error: null, role: userRole || 'admin', requiresEmailConfirmation: false };
      }

      return { error: null, role: 'admin', requiresEmailConfirmation: true };
    }

    return { error: null };
  }, [loadRole]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setRole(null);
    localStorage.removeItem('sagemap_admin_role_cache');
  }, []);

  const value: AuthContextValue = {
    user,
    session,
    role,
    isAdmin: role === 'admin',
    isLoading,
    signIn,
    signUp,
    signOut,
    refreshRole,
    claimAdminRole
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
