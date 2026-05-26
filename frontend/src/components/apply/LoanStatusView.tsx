'use client';
import { formatCurrency } from '@/lib/bre';

interface Loan {
  _id: string; status: string; principalAmount: number; tenureDays: number;
  interestRate: number; simpleInterest: number; totalRepayment: number;
  totalPaid: number; outstandingBalance: number; rejectionReason?: string;
  createdAt: string; disbursedAt?: string; closedAt?: string;
}
interface Props { loan: unknown; onLogout: () => void; }

const STATUS_CONFIG: Record<string, { label: string; emoji: string; gradient: string; border: string; desc: string }> = {
  applied:    { label: 'Under Review',  emoji: '⏳', gradient: 'from-amber-600/20 to-orange-600/20',  border: 'border-amber-500/30',  desc: 'Your application is being reviewed by our sanction team.' },
  sanctioned: { label: 'Sanctioned',    emoji: '✅', gradient: 'from-blue-600/20 to-cyan-600/20',     border: 'border-blue-500/30',   desc: 'Your loan has been approved! Awaiting fund disbursement.' },
  disbursed:  { label: 'Disbursed',     emoji: '💰', gradient: 'from-violet-600/20 to-purple-600/20', border: 'border-violet-500/30', desc: 'Funds have been released. Repayment is in progress.' },
  closed:     { label: 'Fully Repaid',  emoji: '🎉', gradient: 'from-emerald-600/20 to-teal-600/20',  border: 'border-emerald-500/30',desc: 'Your loan has been fully repaid. Congratulations!' },
  rejected:   { label: 'Rejected',      emoji: '❌', gradient: 'from-rose-600/20 to-pink-600/20',     border: 'border-rose-500/30',   desc: 'Your application was not approved.' },
};

const LIFECYCLE = ['applied', 'sanctioned', 'disbursed', 'closed'];

export default function LoanStatusView({ loan: rawLoan, onLogout }: Props) {
  const loan = rawLoan as Loan;
  const config = STATUS_CONFIG[loan.status] || STATUS_CONFIG['applied'];
  const currentIdx = LIFECYCLE.indexOf(loan.status);
  const repayPct = loan.totalRepayment > 0 ? Math.min((loan.totalPaid / loan.totalRepayment) * 100, 100) : 0;

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      <header className="relative border-b border-slate-800/60 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <span className="text-sm font-black text-white">L</span>
            </div>
            <p className="font-bold text-white">LoanFlow</p>
          </div>
          <button onClick={onLogout} className="text-xs text-slate-500 hover:text-rose-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-rose-500/10">
            Logout
          </button>
        </div>
      </header>

      <main className="relative max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Status hero */}
        <div className={`rounded-2xl p-6 bg-gradient-to-br ${config.gradient} border ${config.border}`}>
          <div className="flex items-start gap-4">
            <div className="text-4xl">{config.emoji}</div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-xl font-bold text-white">{config.label}</h2>
                <span className={`badge-${loan.status}`}>{loan.status}</span>
              </div>
              <p className="text-slate-300 text-sm">{config.desc}</p>
              {loan.status === 'rejected' && loan.rejectionReason && (
                <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <p className="text-sm text-rose-300"><span className="font-semibold">Reason:</span> {loan.rejectionReason}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lifecycle tracker */}
        {loan.status !== 'rejected' && (
          <div className="card">
            <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">Loan Lifecycle</h3>
            <div className="flex items-center">
              {LIFECYCLE.map((stage, i) => (
                <div key={stage} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                      ${i < currentIdx ? 'bg-emerald-500 text-white' :
                        i === currentIdx ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white ring-4 ring-violet-500/20' :
                        'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                      {i < currentIdx ? '✓' : i + 1}
                    </div>
                    <p className={`text-xs mt-1.5 capitalize font-medium
                      ${i === currentIdx ? 'text-violet-400' : i < currentIdx ? 'text-emerald-400' : 'text-slate-600'}`}>
                      {stage}
                    </p>
                  </div>
                  {i < LIFECYCLE.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 mb-5 ${i < currentIdx ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loan details grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Principal', value: formatCurrency(loan.principalAmount), icon: '💵' },
            { label: 'Interest', value: formatCurrency(loan.simpleInterest), icon: '📈' },
            { label: 'Total Repayment', value: formatCurrency(loan.totalRepayment), icon: '🏦' },
            { label: 'Tenure', value: `${loan.tenureDays} days`, icon: '📅' },
          ].map(item => (
            <div key={item.label} className="stat-card text-center">
              <p className="text-xl mb-1">{item.icon}</p>
              <p className="text-sm font-bold text-white">{item.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>

        {/* Repayment progress */}
        {(loan.status === 'disbursed' || loan.status === 'closed') && (
          <div className="card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-white">Repayment Progress</h3>
              <span className="text-sm font-bold text-violet-400">{repayPct.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-3 mb-4 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700"
                style={{ width: `${repayPct}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs text-slate-500">Paid</p>
                <p className="text-sm font-bold text-emerald-400">{formatCurrency(loan.totalPaid)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Outstanding</p>
                <p className="text-sm font-bold text-amber-400">{formatCurrency(loan.outstandingBalance)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Total</p>
                <p className="text-sm font-bold text-white">{formatCurrency(loan.totalRepayment)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Applied date */}
        <div className="text-center text-xs text-slate-600">
          Applied on {new Date(loan.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          {loan.disbursedAt && ` · Disbursed on ${new Date(loan.disbursedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`}
        </div>
      </main>
    </div>
  );
}
