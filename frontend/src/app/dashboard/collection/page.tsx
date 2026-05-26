'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import LoanTable, { LoanRow } from '@/components/dashboard/LoanTable';
import { formatCurrency } from '@/lib/bre';

interface Payment {
  _id: string; utrNumber: string; amount: number;
  paymentDate: string; recordedBy?: { fullName: string };
}

export default function CollectionPage() {
  const [loans, setLoans] = useState<LoanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState<LoanRow | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentForm, setPaymentForm] = useState({ utrNumber: '', amount: '', paymentDate: '' });
  const [submitting, setSubmitting] = useState(false);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/loans/disbursed');
      setLoans(data.loans);
    } catch { /* handled */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchLoans(); }, []);

  const openPaymentPanel = async (loan: LoanRow) => {
    setSelectedLoan(loan);
    try {
      const { data } = await api.get(`/payments/loan/${loan._id}`);
      setPayments(data.payments);
    } catch { setPayments([]); }
    setPaymentForm({ utrNumber: '', amount: '', paymentDate: new Date().toISOString().split('T')[0] });
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;
    setSubmitting(true);
    try {
      const { data } = await api.post('/payments', {
        loanId: selectedLoan._id, utrNumber: paymentForm.utrNumber,
        amount: Number(paymentForm.amount), paymentDate: paymentForm.paymentDate,
      });
      toast.success(data.message);
      setPaymentForm({ utrNumber: '', amount: '', paymentDate: new Date().toISOString().split('T')[0] });
      const { data: pd } = await api.get(`/payments/loan/${selectedLoan._id}`);
      setPayments(pd.payments);
      fetchLoans();
      setSelectedLoan(prev => prev ? { ...prev, ...data.loan } : null);
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed');
    } finally { setSubmitting(false); }
  };

  const loanWithBalance = selectedLoan as (LoanRow & { outstandingBalance?: number; totalPaid?: number }) | null;
  const repayPct = loanWithBalance && loanWithBalance.totalRepayment > 0
    ? Math.min(((loanWithBalance.totalPaid || 0) / loanWithBalance.totalRepayment) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Collection</h1>
          <p className="text-slate-400 text-sm mt-1">Record payments · Loan auto-closes when fully repaid</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20">
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-sm font-semibold text-violet-400">{loans.filter(l => l.status === 'disbursed').length} active</span>
        </div>
      </div>

      {loading ? (
        <div className="card flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 animate-pulse" />
            <p className="text-slate-500 text-sm">Loading active loans…</p>
          </div>
        </div>
      ) : (
        <LoanTable
          loans={loans}
          onAction={openPaymentPanel}
          actionLabel="💳 Record Payment"
          actionClass="btn-primary"
          showBalance
          emptyMessage="No active loans for collection"
        />
      )}

      {/* Payment panel modal */}
      {selectedLoan && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4 py-8 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-xl">💳</div>
                <div>
                  <h3 className="font-bold text-white">Record Payment</h3>
                  <p className="text-sm text-slate-400">{selectedLoan.borrowerId?.fullName || selectedLoan.fullName}</p>
                </div>
              </div>
              <button onClick={() => setSelectedLoan(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Balance summary */}
              <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-4">
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-slate-400">Repayment Progress</span>
                  <span className="font-semibold text-white">{repayPct.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2 mb-3 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                    style={{ width: `${repayPct}%` }} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-xs text-slate-500">Total</p>
                    <p className="text-sm font-bold text-white">{formatCurrency(selectedLoan.totalRepayment)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Paid</p>
                    <p className="text-sm font-bold text-emerald-400">{formatCurrency(loanWithBalance?.totalPaid || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Outstanding</p>
                    <p className="text-sm font-bold text-amber-400">{formatCurrency(loanWithBalance?.outstandingBalance || 0)}</p>
                  </div>
                </div>
              </div>

              {/* Payment form */}
              {selectedLoan.status !== 'closed' && (
                <form onSubmit={handleRecordPayment} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">UTR Number</label>
                    <input type="text" className="input-field" value={paymentForm.utrNumber}
                      onChange={e => setPaymentForm(p => ({ ...p, utrNumber: e.target.value }))}
                      placeholder="Unique transaction reference" required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">Amount (₹)</label>
                      <input type="number" className="input-field" value={paymentForm.amount}
                        onChange={e => setPaymentForm(p => ({ ...p, amount: e.target.value }))}
                        placeholder="0" min={1} max={loanWithBalance?.outstandingBalance} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1.5">Payment Date</label>
                      <input type="date" className="input-field" value={paymentForm.paymentDate}
                        onChange={e => setPaymentForm(p => ({ ...p, paymentDate: e.target.value }))} required />
                    </div>
                  </div>
                  <button type="submit" className="btn-primary w-full" disabled={submitting}>
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Recording…
                      </span>
                    ) : '✓ Record Payment'}
                  </button>
                </form>
              )}

              {selectedLoan.status === 'closed' && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <p className="text-emerald-400 font-semibold">🎉 Loan fully repaid and closed</p>
                </div>
              )}

              {/* Payment history */}
              <div>
                <h4 className="text-sm font-semibold text-slate-400 mb-3 flex items-center gap-2">
                  <span>Payment History</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-800 text-xs text-slate-500">{payments.length}</span>
                </h4>
                {payments.length === 0 ? (
                  <p className="text-sm text-slate-600 text-center py-4">No payments recorded yet</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {payments.map(p => (
                      <div key={p._id} className="flex justify-between items-center p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                        <div>
                          <p className="text-sm font-semibold text-white">{formatCurrency(p.amount)}</p>
                          <p className="text-xs text-slate-500 font-mono">UTR: {p.utrNumber}</p>
                        </div>
                        <p className="text-xs text-slate-500">
                          {new Date(p.paymentDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
