import { LogoMark } from '@/components/brand/Logo';

export const metadata = { title: 'Privacy Policy · Grub', description: 'Grub Privacy Policy.' };

export default function PrivacyPage() {
  return (
    <main className="min-h-screen flex flex-col justify-start px-margin-mobile py-xl max-w-md mx-auto gap-lg">
      <div className="flex flex-col gap-sm">
        <LogoMark className="h-16 w-auto lg:hidden" />
        <h1 className="text-3xl font-georgia text-primary mt-4">Privacy Policy</h1>
      </div>

      <div className="bg-surface-container-highest/20 p-4 rounded-lg border border-surface-container-highest">
        <p className="text-sm font-medium text-secondary">
          DRAFT: Pending legal review before public launch.
        </p>
      </div>

      <div className="flex flex-col gap-md text-on-surface text-base leading-relaxed">
        <section className="flex flex-col gap-sm">
          <h2 className="text-xl font-georgia text-primary">1. Authentication and Cookies</h2>
          <p>
            Grub uses Supabase for authentication. You sign in using a magic link sent to your email. We use cookies strictly to keep you signed in and to ensure the app works securely.
          </p>
        </section>

        <section className="flex flex-col gap-sm">
          <h2 className="text-xl font-georgia text-primary">2. What We Store</h2>
          <p>
            We store data necessary to make Grub work for your house:
          </p>
          <ul className="list-disc pl-5 flex flex-col gap-xs">
            <li>Your email address and profile name.</li>
            <li>Household data (who you live with, room names).</li>
            <li>Weekly meal plans, recipe choices, and dietary constraints.</li>
            <li>Tesco basket contents and the resulting splits.</li>
          </ul>
        </section>

        <section className="flex flex-col gap-sm">
          <h2 className="text-xl font-georgia text-primary">3. Payments and Card Details</h2>
          <p>
            Grub never holds money, and we never touch your card details. Settlement between housemates happens via direct bank transfer. The Tesco order is placed directly by the house collector.
          </p>
        </section>

        <section className="flex flex-col gap-sm">
          <h2 className="text-xl font-georgia text-primary">4. Deleting Your Data</h2>
          <p>
            You can delete your account at any time from your account settings. This will permanently delete your profile and detach your data from the house. Note that if you owe money or are owed money for unsettled splits, the app will refuse deletion until those balances are settled.
          </p>
        </section>
      </div>
    </main>
  );
}
