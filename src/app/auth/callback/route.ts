import { NextResponse, type NextRequest } from 'next/server';
import { type EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';

/**
 * Authentication landing route.
 * Handles both:
 * 1. OAuth / PKCE redirects with `code` (exchanged for a session)
 * 2. Magic-link / email verification with `token_hash` & `type` (verified via OTP)
 * 3. Supabase redirect errors (passed through to /login for user feedback)
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const rawNext = searchParams.get('next') ?? '/';
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/';

  // Check if Supabase redirected with an error (e.g. otp_expired, access_denied)
  const errorParam = searchParams.get('error_description') || searchParams.get('error');
  if (errorParam) {
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorParam)}`);
  }

  if (!isSupabaseConfigured) {
    return NextResponse.redirect(`${origin}/login?error=missing_config`);
  }

  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const code = searchParams.get('code');

  const supabase = await createClient();

  // 1. Verify OTP with token_hash (cross-device safe magic link / confirmation)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    });

    if (error) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error.message || 'exchange_failed')}`
      );
    }

    return NextResponse.redirect(`${origin}${next}`);
  }

  // 2. Exchange PKCE code for session
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent(error.message || 'exchange_failed')}`
      );
    }

    return NextResponse.redirect(`${origin}${next}`);
  }

  // Neither code nor token_hash present
  return NextResponse.redirect(`${origin}/login?error=missing_code`);
}

