import { redirect } from 'next/navigation';
import { getCurrentUserOrNull } from '@/lib/queries';
import { ProfileSetupForm } from './ProfileSetupForm';

export const metadata = {
  title: 'Your Flat Profile · Grub',
  description: 'Set your room, budget target, and dietary preferences.',
};

export const dynamic = 'force-dynamic';

export default async function ProfileSetupPage() {
  const user = await getCurrentUserOrNull();
  if (!user) {
    redirect('/login?next=/onboarding/profile');
  }

  return (
    <main className="min-h-screen flex flex-col justify-center px-4 sm:px-6 py-xl max-w-md mx-auto gap-lg">
      <div className="flex flex-col gap-xs pt-sm">
        <span className="text-[11px] font-bold uppercase tracking-wider text-primary font-label-caps">
          Almost Ready
        </span>
        <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-on-surface">
          Your Profile &amp; Habits
        </h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Set your personal budget and habits so dinners fit your routine.
        </p>
      </div>

      <ProfileSetupForm defaultName={user.name === 'Housemate' ? '' : user.name} />
    </main>
  );
}
