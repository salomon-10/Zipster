import { getCurrentUser } from '@/lib/auth/current-user';
import { SiteHeader } from '@/components/layout/site-header';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader user={user} />
      <main className="mx-auto w-full max-w-shell flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
