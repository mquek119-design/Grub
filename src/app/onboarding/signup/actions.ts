'use server';

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getSiteUrl } from '@/lib/siteUrl';
import { isSupabaseConfigured } from '@/lib/supabase/config';

import { redirect } from 'next/navigation';

export interface SignupState {
  status: 'idle' | 'sent' | 'error';
  message: string;
}

/**
 * Send signup magic link / OTP.
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

  const headerList = await headers();
  const host = headerList.get('x-forwarded-host') || headerList.get('host');
  const proto = headerList.get('x-forwarded-proto') || 'https';
  const requestOrigin = host ? `${proto}://${host}` : undefined;
  const origin = getSiteUrl(requestOrigin);

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

  return { status: 'sent', message: `Check ${email} for your code or sign-up link.` };
}

/**
 * Verify 6-digit numeric OTP code sent on sign up.
 */
export async function verifySignupOtp(
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
  const token = String(formData.get('token') ?? '').trim().replace(/\s+/g, '');
  const next = String(formData.get('next') ?? '/onboarding/instructions');

  if (!email) {
    return { status: 'error', message: 'Email address is missing. Please try again.' };
  }

  if (!token || token.length < 6) {
    return { status: 'error', message: 'Enter the 6-digit code sent to your email.' };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });

  if (error) {
    return { status: 'error', message: error.message };
  }

  if (data.session) {
    redirect(next);
  }

  return { status: 'idle', message: 'Signed in successfully.' };
}


