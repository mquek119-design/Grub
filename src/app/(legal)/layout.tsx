import type { ReactNode } from 'react';
import { AuthShell } from '@/components/nav/AuthShell';

export default function LegalLayout({ children }: { children: ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}
