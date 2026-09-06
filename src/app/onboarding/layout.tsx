import type { ReactNode } from 'react';
import { AuthShell } from '@/components/nav/AuthShell';

/** The whole onboarding flow sits in the shared signed-out brand shell. */
export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}
