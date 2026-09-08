'use client';

import { useActionState, useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/media/Icon';
import { Button } from '@/components/ui/Button';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { sendSignupLink, verifySignupOtp, type SignupState } from './actions';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/client';

const INITIAL: SignupState = { status: 'idle', message: '' };

/**
 * Sign up form with magic link and optional 6-digit OTP verification code.
 *
 * Provides two frictionless paths:
 * 1. Click the magic link in email (which redirects back to /auth/callback)
 * 2. Type the 6-digit verification code directly into this screen
 *
 * Listens for auth state changes so if the user clicks the email link in
 * another tab, this tab automatically advances to `next`.
 */
export function SignupForm({ next = '/onboarding/instructions' }: { next?: string }) {
  const [state, formAction] = useActionState(sendSignupLink, INITIAL);
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isVerifyingOtp, startOtpTransition] = useTransition();
  const [redirecting, setRedirecting] = useState(false);
  const router = useRouter();

  // Listen for session established in another tab/window when email link is clicked
  useEffect(() => {
    if (state.status !== 'sent' || !isSupabaseConfigured) return;

    try {
      const supabase = createClient();
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
          setRedirecting(true);
          router.push(next);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } catch {
      // If Supabase is unconfigured, ignore
    }
  }, [state.status, router, next]);

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) return;

    setOtpError(null);
    startOtpTransition(async () => {
      const result = await verifySignupOtp(email, otpCode, next);
      if (result.success) {
        setRedirecting(true);
        router.push(next);
      } else {
        setOtpError(result.message || 'Invalid or expired code. Please try again.');
      }
    });
  };

  const handleManualContinue = () => {
    setRedirecting(true);
    router.push(next);
  };

  if (state.status === 'sent') {
    const isGmail = email.toLowerCase().includes('gmail.com');
    const isOutlook =
      email.toLowerCase().includes('outlook.com') ||
      email.toLowerCase().includes('hotmail.com') ||
      email.toLowerCase().includes('live.com');

    return (
      <div className="flex flex-col gap-lg px-md py-lg rounded-2xl bg-surface-container-lowest border border-surface-container-highest shadow-ambient-card animate-fade-in-up">
        <div className="flex flex-col items-center text-center gap-xs">
          <span className="w-14 h-14 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center mb-xs">
            <Icon name="mark_email_read" filled className="text-[32px]" />
          </span>
          <h2 className="font-title-lg text-title-lg text-primary font-bold">
            Check your inbox
          </h2>
          <p className="font-body-md text-body-md text-on-surface">
            We sent a verification link and code to:
          </p>
          <p className="font-title-sm text-title-sm text-primary font-semibold break-all">
            {email}
          </p>
          <p className="font-body-xs text-body-xs text-on-surface-variant mt-1">
            Click the link in the email, or enter your 6-digit code below:
          </p>
        </div>

        {/* 6-digit OTP code entry */}
        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-sm">
          <label className="flex flex-col gap-xs text-center">
            <span className="font-label-md text-label-md font-medium text-on-surface-variant">
              Enter 6-digit verification code
            </span>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              autoComplete="one-time-code"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\s+/g, ''))}
              placeholder="123456"
              className="h-12 text-center tracking-widest font-mono text-title-lg rounded-lg bg-surface-container-lowest border border-surface-container-highest focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </label>

          {otpError && (
            <p role="alert" className="font-body-xs text-body-xs text-error text-center">
              {otpError}
            </p>
          )}

          <Button
            type="submit"
            variant="secondary"
            size="md"
            fullWidth
            disabled={!otpCode.trim() || isVerifyingOtp || redirecting}
            pending={isVerifyingOtp || redirecting}
          >
            Confirm code & continue
          </Button>
        </form>

        {/* Inbox quick links */}
        <div className="flex flex-col gap-xs pt-xs border-t border-surface-container-highest">
          {isGmail ? (
            <a
              href="https://mail.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 rounded-lg border border-surface-container-highest hover:bg-surface-container text-body-sm font-semibold flex items-center justify-center gap-xs transition-colors text-on-surface"
            >
              <Icon name="open_in_new" className="text-[18px]" />
              Open Gmail
            </a>
          ) : isOutlook ? (
            <a
              href="https://outlook.live.com"
              target="_blank"
              rel="noopener noreferrer"
              className="h-10 rounded-lg border border-surface-container-highest hover:bg-surface-container text-body-sm font-semibold flex items-center justify-center gap-xs transition-colors text-on-surface"
            >
              <Icon name="open_in_new" className="text-[18px]" />
              Open Outlook
            </a>
          ) : null}

          <Button
            onClick={handleManualContinue}
            variant="ghost"
            size="sm"
            fullWidth
            pending={redirecting}
            className="text-on-surface-variant hover:text-on-surface"
          >
            I&apos;ve already verified in another tab
          </Button>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-center font-body-xs text-body-xs text-on-surface-variant hover:text-primary transition-colors py-1"
          >
            Wrong email? Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-md">
      <input type="hidden" name="next" value={next} />

      <label className="flex flex-col gap-xs">
        <span className="font-body-sm text-body-sm font-semibold">
          Email <span aria-hidden="true" className="text-error">*</span>
        </span>
        <input
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          aria-required="true"
          aria-describedby={state.status === 'error' ? 'signup-error' : undefined}
          autoComplete="email"
          placeholder="you@university.ac.uk"
          className="h-12 px-3 rounded-lg bg-surface-container-lowest border border-surface-container-highest focus:ring-2 focus:ring-primary focus:border-primary text-body-lg"
        />
      </label>

      {state.status === 'error' && (
        <p id="signup-error" role="alert" className="font-body-sm text-body-sm text-error">
          {state.message}
        </p>
      )}

      <SubmitButton variant="secondary" size="lg" fullWidth icon="mail" pendingLabel="Sending…">
        Email me a sign-up link
      </SubmitButton>
    </form>
  );
}

