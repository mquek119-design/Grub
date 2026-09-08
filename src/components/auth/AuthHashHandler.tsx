'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';

/**
 * Client-side handler for Supabase authentication hash fragments and session events.
 *
 * Supabase returns errors (e.g. #error=access_denied&error_code=otp_expired)
 * or implicit tokens in the URL hash fragment. Because HTTP servers never receive
 * hash fragments, server-side middleware and SSR cannot see them directly.
 *
 * This component:
 * 1. Catches auth errors in the hash -> clears the hash and redirects to /login with the error parameter.
 * 2. Catches access_token in the hash -> sets session and does a full navigation to / (Feed).
 * 3. Listens to onAuthStateChange -> if SIGNED_IN while on /welcome or /login, immediately navigates to / (Feed).
 */
export function AuthHashHandler() {
  const router = useRouter();

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = createClient();

    function processHash() {
      if (typeof window === 'undefined') return;

      const rawHash = window.location.hash.startsWith('#')
        ? window.location.hash.substring(1)
        : window.location.hash;

      if (!rawHash) return;

      const params = new URLSearchParams(rawHash);

      // 1. Error in hash (e.g., expired token, email link consumed, access denied)
      const errorDescription = params.get('error_description') || params.get('error');
      if (errorDescription) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
        router.push(`/login?error=${encodeURIComponent(errorDescription)}`);
        return;
      }

      // 2. Token in hash (implicit auth flow)
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken) {
        supabase.auth
          .setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          })
          .then(({ error }) => {
            window.history.replaceState(
              null,
              '',
              window.location.pathname + window.location.search
            );
            if (!error) {
              // Full navigation to ensure session cookies are sent in HTTP headers
              window.location.href = '/';
            } else {
              router.push(`/login?error=${encodeURIComponent(error.message)}`);
            }
          });
      }
    }

    processHash();
    window.addEventListener('hashchange', processHash);

    // 3. Listen to auth state changes (e.g. session established by Supabase client)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        const path = window.location.pathname;
        if (path === '/welcome' || path === '/login') {
          window.location.href = '/';
        }
      }
    });

    return () => {
      window.removeEventListener('hashchange', processHash);
      subscription.unsubscribe();
    };
  }, [router]);

  return null;
}
