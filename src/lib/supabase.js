import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if credentials are configured
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  !supabaseUrl.includes('placeholder')
);

// Fallback dummy client for build time or before user sets env variables
const safeUrl = isSupabaseConfigured ? supabaseUrl : 'https://placeholder.supabase.co';
const safeKey = isSupabaseConfigured ? supabaseAnonKey : 'placeholder-anon-key';

export const supabase = createClient(safeUrl, safeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

/**
 * Converts Supabase/PostgreSQL error objects into clean, human-friendly messages
 */
export function formatSupabaseError(error) {
  if (!error) return 'An unexpected error occurred.';
  const msg = error.message || String(error);

  // Unique constraint error on (user_id, phone_key)
  if (msg.includes('contacts_user_id_phone_key_key') || (error.code === '23505' && msg.includes('phone_key'))) {
    return 'A contact with this phone number already exists in your list.';
  }

  // Network or configuration errors
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
    return 'Network connection error. Please check your internet connection and Supabase URL.';
  }

  // Invalid login credentials
  if (msg.includes('Invalid login credentials') || msg.includes('invalid_grant')) {
    return 'Invalid username or password. Please check your credentials.';
  }

  // User already registered
  if (msg.includes('User already registered') || msg.includes('user_already_exists')) {
    return 'An account with this email already exists. Please sign in or reset your password.';
  }

  // Duplicate username
  if (msg.includes('idx_profiles_username_lower') || msg.includes('profiles_username_key')) {
    return 'This username is already taken. Please choose a different username.';
  }

  // Rate limiting on auth
  if (msg.includes('rate limit') || msg.includes('over_email_send_rate_limit')) {
    return 'Email request rate limit exceeded. Please wait a few minutes before trying again.';
  }

  // Email not confirmed
  if (msg.includes('Email not confirmed') || msg.includes('email_not_confirmed')) {
    return 'Email confirmation is pending. Please verify your email inbox or request a new verification email.';
  }

  // JWT / Auth expired
  if (msg.includes('JWT expired') || msg.includes('invalid claim')) {
    return 'Your login session has expired. Please log in again.';
  }

  // Database table permissions missing in Supabase
  if (msg.includes('permission denied for table') || msg.includes('permission denied for schema')) {
    return 'Database table permissions missing. Please run the GRANT permissions SQL in your Supabase SQL Editor.';
  }

  // Row Level Security violation
  if (msg.includes('row-level security') || msg.includes('permission denied')) {
    return 'Access denied. You only have permission to view and modify your own records.';
  }

  return msg;
}

