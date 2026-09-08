import { NextResponse, type NextRequest } from 'next/server';
import { type EmailOtpType } from '@supabase/supabase-js';
import { createServerClient, type CookieMethodsServer } from '@supabase/ssr';
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from '@/lib/supabase/config';
import type { Database } from '@/lib/supabase/database.types';

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
  let next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/';
  if (next === '/welcome' || next === '/login') {
    next = '/';
  }

  // Account for reverse proxies / load balancers on deployed environments (Vercel, custom domains)
  const forwardedHost = request.headers.get('x-forwarded-host');
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https';
  const isLocalEnv = process.env.NODE_ENV === 'development';
  const targetOrigin = isLocalEnv
    ? origin
    : forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : origin;

  // Check if Supabase redirected with an error (e.g. otp_expired, access_denied)
  const errorParam = searchParams.get('error_description') || searchParams.get('error');
  if (errorParam) {
    return NextResponse.redirect(`${targetOrigin}/login?error=${encodeURIComponent(errorParam)}`);
  }

  if (!isSupabaseConfigured) {
    return NextResponse.redirect(`${targetOrigin}/login?error=missing_config`);
  }

  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const code = searchParams.get('code');

  // Construct redirect response upfront so all auth cookies are set directly on the response headers
  const redirectResponse = NextResponse.redirect(`${targetOrigin}${next}`);

  const cookieMethods: CookieMethodsServer = {
    getAll() {
      return request.cookies.getAll();
    },
    setAll(cookiesToSet) {
      cookiesToSet.forEach(({ name, value, options }) => {
        request.cookies.set(name, value);
        redirectResponse.cookies.set(name, value, options);
      });
    },
  };

  const supabase = createServerClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: cookieMethods,
  });

  // 1. Verify OTP with token_hash (cross-device safe magic link / confirmation)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    });

    if (error) {
      return NextResponse.redirect(
        `${targetOrigin}/login?error=${encodeURIComponent(error.message || 'exchange_failed')}`
      );
    }

    return redirectResponse;
  }

  // 2. Exchange PKCE code for session
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        `${targetOrigin}/login?error=${encodeURIComponent(error.message || 'exchange_failed')}`
      );
    }

    return redirectResponse;
  }

  // Neither code nor token_hash present
  return NextResponse.redirect(`${targetOrigin}/login?error=missing_code`);
}

