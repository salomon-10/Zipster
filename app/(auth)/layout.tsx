import Link from 'next/link';
import { Logo } from '@/components/layout/logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-paper px-4 py-10">
      <Link href="/" className="mb-10 flex items-center" aria-label="Zipster home">
        <Logo />
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
