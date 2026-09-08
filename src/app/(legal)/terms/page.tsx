import Link from 'next/link';
import { LogoMark } from '@/components/brand/Logo';

export const metadata = { title: 'Terms & Conditions · Grub', description: 'Grub Terms and Conditions.' };

export default function TermsPage() {
  return (
    <main className="min-h-screen flex flex-col justify-start px-6 sm:px-8 py-xl max-w-md mx-auto gap-lg">
      <div className="flex flex-col gap-sm">
        <Link href="/welcome" aria-label="Grub home" className="inline-block lg:hidden hover:opacity-90 transition-opacity">
          <LogoMark className="h-16 w-auto" />
        </Link>
        <h1 className="text-3xl font-georgia text-primary mt-4">Terms & Conditions</h1>
      </div>

      <div className="bg-surface-container-highest/20 p-4 rounded-lg border border-surface-container-highest">
        <p className="text-sm font-medium text-secondary">
          DRAFT: Pending legal review before public launch.
        </p>
      </div>

      <div className="flex flex-col gap-md text-on-surface text-base leading-relaxed">
        <section className="flex flex-col gap-sm">
          <h2 className="text-xl font-georgia text-primary">1. Acceptable Use</h2>
          <p>
            Grub is designed for university shared households to plan and buy groceries together. You agree to use the service fairly and accurately, and not to misuse the platform to generate false debts or harass others.
          </p>
        </section>

        <section className="flex flex-col gap-sm">
          <h2 className="text-xl font-georgia text-primary">2. Social Verification</h2>
          <p>
            When you mark a balance as "Paid" in Grub, this is a social feature. We do not verify bank transfers or intercept funds. It is between you and your housemates to ensure debts are actually settled. We are not responsible for unpaid debts.
          </p>
        </section>

        <section className="flex flex-col gap-sm">
          <h2 className="text-xl font-georgia text-primary">3. No Warranty</h2>
          <p>
            Grub is provided as-is without any guarantees. Prices shown during planning are estimates pulled from Tesco's public data, and your final receipt might differ due to substitutions or live price changes. We make no warranty regarding the accuracy of grocery prices or the availability of delivery slots.
          </p>
        </section>

        <section className="flex flex-col gap-sm">
          <h2 className="text-xl font-georgia text-primary">4. Contact</h2>
          <p>
            Complaints or questions about these terms go to{' '}
            <a href="mailto:support@grubhouse.uk" className="text-primary font-semibold underline">
              support@grubhouse.uk
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
