'use server';

import { createClient } from '@/lib/supabase/server';
import { getSiteUrl } from '@/lib/siteUrl';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export interface LoginState {
  status: 'idle' | 'sent' | 'error';
  message: string;
}

/**
 * Magic-link sign-in.
 *
 * Chosen over passwords deliberately: students share houses, not password
 * managers, and a link to a university inbox is the lowest-friction path that
 * still proves control of the address. No password means no password reset
 * flow and nothing to leak.
 */
export async function sendMagicLink(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  if (!isSupabaseConfigured) {
    return {
      status: 'error',
      message: 'Supabase is not configured yet — the app is running on fixtures.',
    };
  }

  const email = String(formData.get('email') ?? '').trim();
  const next = String(formData.get('next') ?? '/');

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { status: 'error', message: 'Enter a valid email address.' };
  }

  const origin = getSiteUrl();

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      data: {
        flow: 'login',
      },
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    return { status: 'error', message: error.message };
  }

  return { status: 'sent', message: `Check ${email} for your sign-in link or 6-digit code.` };
}

/**
 * Verify 6-digit OTP code directly on login screen.
 */
export async function verifyLoginOtp(
  email: string,
  token: string
): Promise<{ success: boolean; message?: string }> {
  if (!isSupabaseConfigured) {
    return { success: false, message: 'Supabase is not configured yet.' };
  }

  const cleanEmail = email.trim();
  const cleanToken = token.trim();

  if (!cleanEmail || !cleanToken) {
    return { success: false, message: 'Enter your email and the 6-digit code.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    email: cleanEmail,
    token: cleanToken,
    type: 'email',
  });

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true };
}

