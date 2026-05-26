'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser } from '@/lib/auth';

export default function ApplyLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.replace('/auth/login');
      return;
    }
    if (user.role !== 'borrower') {
      router.replace('/dashboard');
    }
  }, [router]);

  return <>{children}</>;
}
