'use client';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getStoredUser, clearAuth } from '@/lib/auth';

const NAV_ITEMS = [
  { href: '/dashboard',              label: 'Overview',     icon: '📊', roles: ['admin'] },
  { href: '/dashboard/sales',        label: 'Sales',        icon: '🎯', roles: ['sales', 'admin'] },
  { href: '/dashboard/sanction',     label: 'Sanction',     icon: '✅', roles: ['sanction', 'admin'] },
  { href: '/dashboard/disbursement', label: 'Disbursement', icon: '💸', roles: ['disbursement', 'admin'] },
  { href: '/dashboard/collection',   label: 'Collection',   icon: '💰', roles: ['collection', 'admin'] },
];

const ROLE_COLORS: Record<string, string> = {
  admin: 'from-violet-500 to-indigo-500',
  sales: 'from-blue-500 to-cyan-500',
  sanction: 'from-amber-500 to-orange-500',
  disbursement: 'from-purple-500 to-pink-500',
  collection: 'from-emerald-500 to-teal-500',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(getStoredUser());

  useEffect(() => {
    const u = getStoredUser();
    if (!u) { router.replace('/auth/login'); return; }
    if (u.role === 'borrower') { router.replace('/apply'); return; }
    setUser(u);
  }, [router]);

  const handleLogout = () => { clearAuth(); router.push('/auth/login'); };
  if (!user) return null;

  const visibleNav = NAV_ITEMS.filter(item => item.roles.includes(user.role));
  const roleGradient = ROLE_COLORS[user.role] || ROLE_COLORS.admin;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      {/* Top bar */}
      <header className="h-14 border-b border-slate-800/60 bg-slate-900/80 backdrop-blur-sm flex items-center px-4 gap-4 sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
            <span className="text-xs font-black text-white">L</span>
          </div>
          <span className="font-bold text-white text-sm hidden sm:block">LoanFlow</span>
          <span className="text-slate-700 hidden sm:block">|</span>
          <span className="text-slate-400 text-xs hidden sm:block">Operations</span>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
            <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${roleGradient} flex items-center justify-center text-xs font-bold text-white`}>
              {user.fullName?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-semibold text-white leading-none">{user.fullName}</p>
              <p className={`text-xs capitalize bg-gradient-to-r ${roleGradient} bg-clip-text text-transparent font-medium`}>{user.role}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="text-xs text-slate-500 hover:text-rose-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20">
            Logout
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-52 border-r border-slate-800/60 bg-slate-900/40 flex-shrink-0 pt-4 pb-6 flex flex-col">
          <nav className="flex-1 px-3 space-y-1">
            {visibleNav.map(item => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150
                    ${active
                      ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/20 text-violet-300 border border-violet-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'}`}>
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                  {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400" />}
                </Link>
              );
            })}
          </nav>

          {/* Role badge at bottom */}
          <div className="px-3 mt-4">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${roleGradient} bg-opacity-10`} style={{ background: 'rgba(139,92,246,0.08)' }}>
              <p className="text-xs text-slate-500 mb-1">Logged in as</p>
              <p className={`text-sm font-bold capitalize bg-gradient-to-r ${roleGradient} bg-clip-text text-transparent`}>{user.role}</p>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
