import { VisualGuide } from '@/components/onboarding/VisualGuide';

export const metadata = {
  title: 'How Grub Works · Grub',
  description: 'How the week runs, and where everything lives.',
};

/**
 * Visual interactive tour shown to new users after signup.
 * Teaches Feed, Plan, Tesco Automation with Cookie-Editor, Slot Reservation, and Split/Cook mode.
 */
export default function InstructionsPage() {
  return (
    <main className="min-h-screen flex flex-col justify-center px-4 sm:px-6 py-lg max-w-lg mx-auto">
      <VisualGuide />
    </main>
  );
}
