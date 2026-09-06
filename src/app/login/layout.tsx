import type { ReactNode } from 'react';
import { AuthShell } from '@/components/nav/AuthShell';

/** Login shares the signed-out brand shell with onboarding. */
export default function LoginLayout({ children }: { children: ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}
