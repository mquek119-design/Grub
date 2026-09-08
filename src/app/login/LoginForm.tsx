'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/media/Icon';
import { Button } from '@/components/ui/Button';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { sendMagicLink, type LoginState } from './actions';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/client';

const INITIAL: LoginState = { status: 'idle', message: '' };

export function LoginForm({ next = '/' }: { next: string }) {
  const [state, formAction] = useActionState(sendMagicLink, INITIAL);
  const [email, setEmail] = useState('');
  const [redirecting, setRedirecting] = useState(false);
  const router = useRouter();

  const destination = next && next !== '/welcome' && next !== '/login' ? next : '/';

  // Automatically advance if session is established in another tab/window
  useEffect(() => {
    if (state.status !== 'sent' || !isSupabaseConfigured) return;

    try {
      const supabase = createClient();
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
          setRedirecting(true);
          router.push(destination);
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    } catch {
      // If Supabase is unconfigured, ignore
    }
  }, [state.status, router, destination]);

  const handleManualContinue = () => {
    setRedirecting(true);
    router.push(destination);
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
            We sent a sign-in link to:
          </p>
          <p className="font-title-sm text-title-sm text-primary font-semibold break-all">
            {email}
          </p>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 max-w-xs">
            Click the link in your email to sign in directly to your house.
          </p>
        </div>

        <div className="flex flex-col gap-sm pt-xs border-t border-surface-container-highest">
          {isGmail ? (
            <a
              href="https://mail.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 rounded-lg bg-primary text-on-primary hover:bg-primary/90 text-body-md font-semibold flex items-center justify-center gap-xs transition-colors shadow-sm"
            >
              <Icon name="open_in_new" className="text-[18px]" />
              Open Gmail
            </a>
          ) : isOutlook ? (
            <a
              href="https://outlook.live.com"
              target="_blank"
              rel="noopener noreferrer"
              className="h-11 rounded-lg bg-primary text-on-primary hover:bg-primary/90 text-body-md font-semibold flex items-center justify-center gap-xs transition-colors shadow-sm"
            >
              <Icon name="open_in_new" className="text-[18px]" />
              Open Outlook
            </a>
          ) : null}

          <Button
            onClick={handleManualContinue}
            variant={isGmail || isOutlook ? 'secondary' : 'primary'}
            size="lg"
            fullWidth
            pending={redirecting}
          >
            I&apos;ve signed in
          </Button>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="text-center font-body-xs text-body-xs text-on-surface-variant hover:text-primary transition-colors py-1"
          >
            Entered the wrong email? Click here to re-enter
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
          aria-describedby={state.status === 'error' ? 'login-error' : undefined}
          autoComplete="email"
          placeholder="you@university.ac.uk"
          className="h-12 px-3 rounded-lg bg-surface-container-lowest border border-surface-container-highest focus:ring-2 focus:ring-primary focus:border-primary text-body-lg"
        />
      </label>

      {state.status === 'error' && (
        <p id="login-error" role="alert" className="font-body-sm text-body-sm text-error">
          {state.message}
        </p>
      )}

      <SubmitButton variant="secondary" size="lg" fullWidth icon="mail" pendingLabel="Sending…">
        Email me a link
      </SubmitButton>
    </form>
  );
}
