'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';

/**
 * Client-side handler for Supabase authentication hash fragments.
 *
 * Supabase returns errors (e.g. #error=access_denied&error_code=otp_expired)
 * or implicit tokens in the URL hash fragment. Because HTTP servers never receive
 * hash fragments, server-side middleware and SSR cannot see them directly.
 *
 * This component intercepts:
 * 1. Auth errors in the hash -> clears the hash and redirects to /login with the error parameter
 *    so the user sees a visible, actionable error banner instead of being stranded on /welcome.
 * 2. Auth tokens in the hash -> persists the session and advances to / (Feed).
 */
export function AuthHashHandler() {
  const router = useRouter();

  useEffect(() => {
    function processHash() {
      if (typeof window === 'undefined' || !window.location.hash) return;

      const rawHash = window.location.hash.startsWith('#')
        ? window.location.hash.substring(1)
        : window.location.hash;

      if (!rawHash) return;

      const params = new URLSearchParams(rawHash);

      // 1. Error in hash (e.g., expired token, email link consumed, access denied)
      const errorDescription = params.get('error_description') || params.get('error');
      if (errorDescription) {
        // Clear hash from browser address bar
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
        router.push(`/login?error=${encodeURIComponent(errorDescription)}`);
        return;
      }

      // 2. Token in hash (implicit auth flow)
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken && isSupabaseConfigured) {
        try {
          const supabase = createClient();
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
                router.push('/');
                router.refresh();
              } else {
                router.push(`/login?error=${encodeURIComponent(error.message)}`);
              }
            });
        } catch {
          // If Supabase is unconfigured, ignore
        }
      }
    }

    processHash();
    window.addEventListener('hashchange', processHash);
    return () => {
      window.removeEventListener('hashchange', processHash);
    };
  }, [router]);

  return null;
}
