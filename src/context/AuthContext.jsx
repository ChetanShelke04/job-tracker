import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured, formatSupabaseError } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper: map username or email to valid Supabase email
  const resolveEmail = (input) => {
    const raw = String(input || '').trim().toLowerCase();
    if (raw.includes('@')) {
      return raw;
    }
    return `${raw}@jobtracker.app`;
  };

  // Helper: extract friendly username from user email
  const getUsername = (userObj) => {
    if (!userObj || !userObj.email) return 'User';
    const email = userObj.email;
    if (email.endsWith('@jobtracker.app')) {
      return email.replace('@jobtracker.app', '');
    }
    return email.split('@')[0];
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Get current session on load
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!error && session) {
        setSession(session);
        setUser(session.user);
      }
      setLoading(false);
    });

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Login using username or email
  const login = async (usernameOrEmail, password) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured yet. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.');
    }

    const email = resolveEmail(usernameOrEmail);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw new Error(formatSupabaseError(error));
    }

    return data;
  };

  // Register user (if public registration is enabled or for initial setup)
  const register = async (usernameOrEmail, password) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured yet.');
    }

    const email = resolveEmail(usernameOrEmail);
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      throw new Error(formatSupabaseError(error));
    }

    return data;
  };

  // Password reset request
  const resetPassword = async (usernameOrEmail) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured yet.');
    }

    const email = resolveEmail(usernameOrEmail);
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/login'
    });

    if (error) {
      throw new Error(formatSupabaseError(error));
    }

    return data;
  };

  // Logout
  const logout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
  };

  const value = {
    user,
    session,
    username: getUsername(user),
    loading,
    isConfigured: isSupabaseConfigured,
    login,
    register,
    resetPassword,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

