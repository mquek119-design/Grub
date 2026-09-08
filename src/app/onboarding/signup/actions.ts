'use server';

import { createClient } from '@/lib/supabase/server';
import { getSiteUrl } from '@/lib/siteUrl';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export interface SignupState {
  status: 'idle' | 'sent' | 'error';
  message: string;
}

/**
 * Send signup magic link.
 *
 * Redirects to the `next` URL after email verification (default: /onboarding/instructions).
 * This allows signup to be chained with other flows like invites.
 *
 * Example: /onboarding/signup?next=/onboarding/join?code=ABC123
 */
export async function sendSignupLink(
  _prev: SignupState,
  formData: FormData
): Promise<SignupState> {
  if (!isSupabaseConfigured) {
    return {
      status: 'error',
      message: 'Supabase is not configured yet — the app is running on fixtures.',
    };
  }

  const email = String(formData.get('email') ?? '').trim();
  const next = String(formData.get('next') ?? '/onboarding/instructions');

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { status: 'error', message: 'Enter a valid email address.' };
  }

  const origin = getSiteUrl();

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      data: {
        flow: 'signup',
      },
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    return { status: 'error', message: error.message };
  }

  return { status: 'sent', message: `Check ${email} for your sign-up link or 6-digit code.` };
}

/**
 * Verify 6-digit OTP code directly on screen without leaving the page.
 */
export async function verifySignupOtp(
  email: string,
  token: string,
  next = '/onboarding/instructions'
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

