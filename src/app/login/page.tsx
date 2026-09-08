import Link from 'next/link';
import { LoginForm } from './LoginForm';
import { LogoMark } from '@/components/brand/Logo';
import { Stocky } from '@/components/mascot/Stocky';

export const metadata = { title: 'Sign in · Grub', description: 'Sign in to your Grub account.' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  let errorMessage: string | null = null;
  if (params.error) {
    const raw = params.error.toLowerCase();
    if (raw === 'exchange_failed' || raw.includes('expired') || raw.includes('otp_expired') || raw.includes('invalid')) {
      errorMessage = 'That sign-in link has expired or was already used. Enter your email below to get a fresh link.';
    } else if (raw === 'missing_code') {
      errorMessage = 'That sign-in link was incomplete or invalid. Request a new one below.';
    } else if (raw === 'missing_config') {
      errorMessage = 'Authentication is not configured yet.';
    } else {
      try {
        errorMessage = decodeURIComponent(params.error);
      } catch {
        errorMessage = params.error;
      }
    }
  }

  return (
    <main className="min-h-screen flex flex-col justify-center px-6 sm:px-8 py-xl max-w-md mx-auto gap-lg">
      <div className="flex flex-col gap-sm">
        {/* Hidden on desktop, where the AuthShell brand panel carries the mark;
            the heading stays so the page keeps its h1. */}
        <Link href="/welcome" aria-label="Grub home" className="inline-block lg:hidden hover:opacity-90 transition-opacity">
          <LogoMark className="h-16 w-auto" />
        </Link>
        <div className="flex items-center justify-between">
          <h1
            className="font-headline-lg text-headline-lg text-primary"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Grub
          </h1>
          <Stocky mood="neutral" size="sm" caption="Welcome" />
        </div>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Sign in with your email. We&apos;ll send you a link — no password to remember.
        </p>
      </div>

      {errorMessage && (
        <p
          role="alert"
          className="px-md py-sm rounded-lg bg-error-container text-on-error-container font-body-sm text-body-sm"
        >
          {errorMessage}
        </p>
      )}

      <LoginForm next={params.next ?? '/'} />

      <p className="text-center font-body-sm text-body-sm text-on-surface-variant">
        New to Grub?{' '}
        <Link href="/onboarding/signup" className="text-primary font-semibold hover:opacity-80">
          Sign up
        </Link>
      </p>
    </main>
  );
}
