import { formatCurrency } from '@/lib/bre';

export interface LoanRow {
  _id: string; fullName: string;
  borrowerId?: { email: string; fullName: string };
  principalAmount: number; tenureDays: number; totalRepayment: number;
  outstandingBalance?: number; totalPaid?: number;
  status: string; createdAt: string; sanctionedAt?: string; disbursedAt?: string;
}

interface Props {
  loans: LoanRow[];
  onAction?: (loan: LoanRow) => void;
  actionLabel?: string;
  actionClass?: string;
  secondaryAction?: (loan: LoanRow) => void;
  secondaryLabel?: string;
  showBalance?: boolean;
  emptyMessage?: string;
}

const STATUS_DOT: Record<string, string> = {
  applied:    'bg-amber-400',
  sanctioned: 'bg-blue-400',
  disbursed:  'bg-violet-400',
  closed:     'bg-emerald-400',
  rejected:   'bg-rose-400',
};

export default function LoanTable({
  loans, onAction, actionLabel, actionClass = 'btn-primary',
  secondaryAction, secondaryLabel, showBalance, emptyMessage = 'No loans found',
}: Props) {
  if (loans.length === 0) {
    return (
      <div className="card text-center py-16">
        <div className="text-5xl mb-4">📭</div>
        <p className="text-slate-400 font-medium">{emptyMessage}</p>
        <p className="text-slate-600 text-sm mt-1">Nothing to show here right now</p>
      </div>
    );
  }

  return (
    <div className="card p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Borrower</th>
              <th>Amount</th>
              <th>Tenure</th>
              <th>Total Repayment</th>
              {showBalance && <th>Outstanding</th>}
              <th>Status</th>
              <th>Date</th>
              {(onAction || secondaryAction) && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {loans.map(loan => (
              <tr key={loan._id}>
                <td>
                  <div>
                    <p className="font-semibold text-white text-sm">{loan.borrowerId?.fullName || loan.fullName}</p>
                    {loan.borrowerId?.email && (
                      <p className="text-xs text-slate-500 mt-0.5">{loan.borrowerId.email}</p>
                    )}
                  </div>
                </td>
                <td>
                  <span className="font-semibold text-white">{formatCurrency(loan.principalAmount)}</span>
                </td>
                <td>
                  <span className="text-slate-300">{loan.tenureDays}d</span>
                </td>
                <td>
                  <span className="text-slate-300">{formatCurrency(loan.totalRepayment)}</span>
                </td>
                {showBalance && (
                  <td>
                    <span className="font-semibold text-amber-400">
                      {formatCurrency(loan.outstandingBalance ?? 0)}
                    </span>
                  </td>
                )}
                <td>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${STATUS_DOT[loan.status] || 'bg-slate-500'}`} />
                    <span className={`badge-${loan.status}`}>{loan.status}</span>
                  </div>
                </td>
                <td>
                  <span className="text-slate-500 text-xs">
                    {new Date(loan.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                  </span>
                </td>
                {(onAction || secondaryAction) && (
                  <td>
                    <div className="flex items-center gap-2">
                      {onAction && actionLabel && loan.status !== 'closed' && (
                        <button className={`${actionClass} text-xs px-3 py-1.5`} onClick={() => onAction(loan)}>
                          {actionLabel}
                        </button>
                      )}
                      {secondaryAction && secondaryLabel && loan.status !== 'closed' && (
                        <button className="btn-danger text-xs px-3 py-1.5" onClick={() => secondaryAction(loan)}>
                          {secondaryLabel}
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
