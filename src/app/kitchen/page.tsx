import { redirect } from 'next/navigation';

export default async function KitchenPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  if (params.tab === 'leftovers') {
    redirect('/leftovers');
  }
  if (params.tab === 'pantry') {
    redirect('/pantry');
  }
  redirect('/recipes');
}
