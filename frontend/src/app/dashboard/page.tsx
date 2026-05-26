'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { getStoredUser } from '@/lib/auth';
import { formatCurrency } from '@/lib/bre';

interface Stats {
  totalBorrowers: number; totalLoans: number; appliedLoans: number;
  sanctionedLoans: number; disbursedLoans: number; closedLoans: number;
  rejectedLoans: number; totalDisbursedAmount: number; totalCollected: number;
}

export default function DashboardOverview() {
  const router = useRouter();
  const user = getStoredUser();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'admin') {
      const map: Record<string, string> = {
        sales: '/dashboard/sales', sanction: '/dashboard/sanction',
        disbursement: '/dashboard/disbursement', collection: '/dashboard/collection',
      };
      router.replace(map[user.role] || '/dashboard/sales');
      return;
    }
    api.get('/dashboard/stats').then(({ data }) => setStats(data)).catch(() => {});
  }, [router, user]);

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 animate-pulse" />
          <p className="text-slate-500 text-sm">Loading stats…</p>
        </div>
      </div>
    );
  }

  const statusCards = [
    { label: 'Applied',    value: stats.appliedLoans,    icon: '⏳', color: 'from-amber-500/20 to-orange-500/20',  border: 'border-amber-500/20',  text: 'text-amber-400' },
    { label: 'Sanctioned', value: stats.sanctionedLoans, icon: '✅', color: 'from-blue-500/20 to-cyan-500/20',     border: 'border-blue-500/20',   text: 'text-blue-400' },
    { label: 'Disbursed',  value: stats.disbursedLoans,  icon: '💸', color: 'from-violet-500/20 to-purple-500/20', border: 'border-violet-500/20', text: 'text-violet-400' },
    { label: 'Closed',     value: stats.closedLoans,     icon: '🎉', color: 'from-emerald-500/20 to-teal-500/20',  border: 'border-emerald-500/20',text: 'text-emerald-400' },
    { label: 'Rejected',   value: stats.rejectedLoans,   icon: '❌', color: 'from-rose-500/20 to-pink-500/20',     border: 'border-rose-500/20',   text: 'text-rose-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white">Admin Overview</h1>
        <p className="text-slate-400 text-sm mt-1">Real-time snapshot of the loan portfolio</p>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Borrowers', value: stats.totalBorrowers, icon: '👥', gradient: 'from-violet-600 to-indigo-600' },
          { label: 'Total Loans',     value: stats.totalLoans,     icon: '📋', gradient: 'from-blue-600 to-cyan-600' },
          { label: 'Disbursed Amount',value: formatCurrency(stats.totalDisbursedAmount), icon: '💵', gradient: 'from-purple-600 to-pink-600' },
          { label: 'Total Collected', value: formatCurrency(stats.totalCollected), icon: '🏦', gradient: 'from-emerald-600 to-teal-600' },
        ].map(card => (
          <div key={card.label} className="stat-card group hover:scale-[1.02] transition-transform duration-200">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-lg mb-3 shadow-lg`}>
              {card.icon}
            </div>
            <p className="text-2xl font-black text-white">{card.value}</p>
            <p className="text-xs text-slate-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Status breakdown */}
      <div>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Loan Status Breakdown</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {statusCards.map(card => (
            <div key={card.label} className={`rounded-2xl p-4 bg-gradient-to-br ${card.color} border ${card.border} text-center`}>
              <p className="text-2xl mb-1">{card.icon}</p>
              <p className={`text-2xl font-black ${card.text}`}>{card.value}</p>
              <p className="text-xs text-slate-400 mt-1">{card.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Collection rate */}
      {stats.totalDisbursedAmount > 0 && (
        <div className="card">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-white">Collection Rate</h3>
            <span className="text-sm font-bold text-emerald-400">
              {((stats.totalCollected / stats.totalDisbursedAmount) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
              style={{ width: `${Math.min((stats.totalCollected / stats.totalDisbursedAmount) * 100, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500 mt-2">
            <span>Collected: {formatCurrency(stats.totalCollected)}</span>
            <span>Disbursed: {formatCurrency(stats.totalDisbursedAmount)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
