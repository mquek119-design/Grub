import type { ReactNode } from 'react';
import Link from 'next/link';
import { LogoMark } from '@/components/brand/Logo';

/**
 * Two-panel shell for the signed-out surfaces — onboarding and login.
 *
 * On desktop those screens were a ~448px column marooned in the middle of a
 * 1440px page, most of it empty oat. This puts a Forest brand panel in the left
 * half so the content sits balanced in the right half instead of adrift.
 *
 * Desktop-only (lg+). On mobile the panel is hidden and the page renders exactly
 * as before — its own max-w-md column, its own compact identity — so nothing
 * about the phone experience changes. Pages should hide their own logo mark on
 * lg (the panel carries it) but keep their heading, so the page keeps its h1.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="lg:grid lg:grid-cols-2">
      <aside className="hidden lg:flex lg:sticky lg:top-0 lg:h-screen flex-col justify-between overflow-hidden bg-primary text-on-primary p-[3rem]">
        {/* Dot field, matching the Feed's primary card. Decoration only. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.14] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, #D8F3DC 1px, transparent 0)',
            backgroundSize: '22px 22px',
          }}
        />

        <Link href="/welcome" aria-label="Grub home" className="relative z-10 inline-block hover:opacity-90 transition-opacity">
          <LogoMark tone="onDark" className="h-11 w-auto" />
        </Link>

        <p className="relative z-10 font-georgia text-headline-lg text-on-primary max-w-md leading-tight">
          The buying unit is the house, not you.
        </p>

        <p className="relative z-10 font-body-sm text-body-sm text-primary-fixed/80 max-w-sm">
          One shop that clears the collection minimum, shared ingredients bought once, and everyone
          paying for what they actually ate. Built for UK student houses.
        </p>
      </aside>

      {/* The page. Its own main still centres inside this right half. */}
      <div className="min-w-0">{children}</div>
    </div>
  );
}
