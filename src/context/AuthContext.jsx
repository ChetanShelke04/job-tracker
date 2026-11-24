import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured, formatSupabaseError } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper: fetch profile row from database
  const fetchProfile = useCallback(async (userId, userMetadata = null, email = null) => {
    if (!userId || !isSupabaseConfigured) return null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!error && data) {
        setProfile(data);
        return data;
      }

      // Fallback: If profile row is not yet created by trigger, synthesize from user metadata
      if (userMetadata || email) {
        const fallbackProfile = {
          id: userId,
          full_name: userMetadata?.full_name || email?.split('@')[0] || 'User',
          username: userMetadata?.username || email?.split('@')[0] || 'user',
          email: email || '',
          role: userMetadata?.role || 'user'
        };
        setProfile(fallbackProfile);
        return fallbackProfile;
      }
    } catch (err) {
      console.warn('Could not fetch user profile:', err);
    }
    return null;
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // 1. Initial session check on load
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!error && session?.user) {
        setSession(session);
        setUser(session.user);
        fetchProfile(session.user.id, session.user.user_metadata, session.user.email);
      }
      setLoading(false);
    });

    // 2. Real-time auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchProfile(session.user.id, session.user.user_metadata, session.user.email);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  // Check whether an input string is an email
  const isEmail = (input) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(input || '').trim());
  };

  // Securely resolve username to email via RPC
  const resolveLoginEmail = async (username) => {
    const cleanUsername = String(username || '').trim();
    if (!cleanUsername) return null;

    const { data, error } = await supabase.rpc('get_login_email', {
      p_username: cleanUsername
    });

    if (error) {
      console.warn('Username resolution error:', error);
      return null;
    }
    return data || null;
  };

  // Check if a username is available during registration
  const checkUsernameAvailable = async (username) => {
    const clean = String(username || '').trim();
    if (clean.length < 3) return false;

    const { data, error } = await supabase.rpc('check_username_available', {
      p_username: clean
    });

    if (error) {
      console.warn('Username check error:', error);
      return true; // Don't block client if check fails
    }
    return Boolean(data);
  };

  // Login using Username OR Email
  const login = async (identifier, password) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured yet. Please set environment variables in your .env file.');
    }

    const cleanIdentifier = String(identifier || '').trim();
    let loginEmail = cleanIdentifier;

    if (!isEmail(cleanIdentifier)) {
      // Username provided: resolve to registered email
      loginEmail = await resolveLoginEmail(cleanIdentifier);
      if (!loginEmail) {
        throw new Error('Invalid username or password. Please check your credentials.');
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password
    });

    if (error) {
      throw new Error(formatSupabaseError(error));
    }

    if (data?.user) {
      setUser(data.user);
      setSession(data.session);
      await fetchProfile(data.user.id, data.user.user_metadata, data.user.email);
    }

    return data;
  };

  // Register a new user with real email, username, and role
  const register = async ({ fullName, username, email, password, role = 'user' }) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured yet.');
    }

    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanUsername = String(username || '').trim();
    const cleanFullName = String(fullName || '').trim();
    const cleanRole = role === 'hr' ? 'hr' : 'user';

    if (!isEmail(cleanEmail)) {
      throw new Error('Please enter a valid email address.');
    }

    if (!cleanUsername || cleanUsername.length < 3) {
      throw new Error('Username must be at least 3 characters long.');
    }

    if (!cleanFullName) {
      throw new Error('Please enter your full name.');
    }

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: cleanFullName,
          username: cleanUsername,
          role: cleanRole
        },
        emailRedirectTo: `${window.location.origin}/verify-email`
      }
    });

    if (error) {
      throw new Error(formatSupabaseError(error));
    }

    // If auto-confirmation is active and session exists, fetch profile immediately
    if (data?.session && data?.user) {
      setUser(data.user);
      setSession(data.session);
      await fetchProfile(data.user.id, data.user.user_metadata, data.user.email);
    }

    return {
      user: data.user,
      session: data.session,
      needsEmailVerification: Boolean(data.user && !data.session && !data.user.email_confirmed_at)
    };
  };

  // Resend email verification link with cooldown support
  const resendVerificationEmail = async (email) => {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!isEmail(cleanEmail)) {
      throw new Error('Please provide a valid email address.');
    }

    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: cleanEmail,
      options: {
        emailRedirectTo: `${window.location.origin}/verify-email`
      }
    });

    if (error) {
      throw new Error(formatSupabaseError(error));
    }
    return data;
  };

  // Request password reset email
  const resetPassword = async (email) => {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!isEmail(cleanEmail)) {
      throw new Error('Please enter a valid registered email address.');
    }

    const { data, error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) {
      throw new Error(formatSupabaseError(error));
    }
    return data;
  };

  // Update password (used during password recovery callback)
  const updatePassword = async (newPassword) => {
    if (!isSupabaseConfigured) throw new Error('Supabase is not configured.');

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      throw new Error(formatSupabaseError(error));
    }
    return data;
  };

  // Change password for logged-in user (requires re-authenticating current password first)
  const changePassword = async (currentPassword, newPassword) => {
    if (!user || !user.email) {
      throw new Error('You must be signed in to change your password.');
    }

    // 1. Verify current password
    const { error: reAuthError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword
    });

    if (reAuthError) {
      throw new Error('Current password is incorrect. Please try again.');
    }

    // 2. Set new password
    const { data, error: updateError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (updateError) {
      throw new Error(formatSupabaseError(updateError));
    }

    return data;
  };

  // Update user profile details
  const updateProfile = async ({ fullName, username }) => {
    if (!user) throw new Error('Not authenticated.');

    const updates = {
      full_name: fullName.trim(),
      username: username.trim(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      throw new Error(formatSupabaseError(error));
    }

    setProfile(data);
    return data;
  };

  // Sign out
  const logout = async () => {
    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  // Derived attributes
  const isEmailVerified = Boolean(user?.email_confirmed_at);
  const username = profile?.username || user?.user_metadata?.username || user?.email?.split('@')[0] || 'User';
  const fullName = profile?.full_name || user?.user_metadata?.full_name || username;
  const role = profile?.role || user?.user_metadata?.role || 'user';
  const isHR = role === 'hr';

  const value = {
    user,
    session,
    profile,
    username,
    fullName,
    role,
    isHR,
    isEmailVerified,
    loading,
    isConfigured: isSupabaseConfigured,
    login,
    register,
    checkUsernameAvailable,
    resendVerificationEmail,
    resetPassword,
    updatePassword,
    changePassword,
    updateProfile,
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
