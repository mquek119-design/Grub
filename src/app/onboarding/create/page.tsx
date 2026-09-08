import Link from 'next/link';
import { Icon } from '@/components/media/Icon';
import { CreateHouseForm } from './CreateHouseForm';

export const metadata = { title: 'Create a House · Grub', description: 'Set up a new house on Grub.' };

export default function CreateHousePage() {
  return (
    <main className="min-h-screen flex flex-col px-6 sm:px-8 py-lg max-w-md mx-auto gap-md">
      <Link
        href="/onboarding"
        className="flex items-center gap-xs text-primary font-semibold text-[14px] w-fit hover:opacity-80"
      >
        <Icon name="arrow_back" className="text-[18px]" />
        Back
      </Link>

      <CreateHouseForm />
    </main>
  );
}
