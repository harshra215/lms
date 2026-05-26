'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import LoanTable, { LoanRow } from '@/components/dashboard/LoanTable';

export default function SanctionPage() {
  const [loans, setLoans] = useState<LoanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState<{ loan: LoanRow | null; reason: string }>({ loan: null, reason: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/loans/applied');
      setLoans(data.loans);
    } catch { /* handled */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchLoans(); }, []);

  const handleSanction = async (loan: LoanRow) => {
    if (!confirm(`Approve loan for ${loan.borrowerId?.fullName || loan.fullName}?`)) return;
    setActionLoading(true);
    try {
      await api.patch(`/loans/${loan._id}/sanction`);
      toast.success('Loan sanctioned ✓');
      fetchLoans();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed');
    } finally { setActionLoading(false); }
  };

  const handleReject = async () => {
    if (!rejectModal.loan || !rejectModal.reason.trim()) { toast.error('Please provide a rejection reason'); return; }
    setActionLoading(true);
    try {
      await api.patch(`/loans/${rejectModal.loan._id}/reject`, { rejectionReason: rejectModal.reason });
      toast.success('Loan rejected');
      setRejectModal({ loan: null, reason: '' });
      fetchLoans();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed');
    } finally { setActionLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Sanction</h1>
          <p className="text-slate-400 text-sm mt-1">Review and approve or reject loan applications</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-sm font-semibold text-amber-400">{loans.length} pending</span>
        </div>
      </div>

      {loading ? (
        <div className="card flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 animate-pulse" />
            <p className="text-slate-500 text-sm">Loading applications…</p>
          </div>
        </div>
      ) : (
        <LoanTable
          loans={loans}
          onAction={handleSanction}
          actionLabel={actionLoading ? '…' : 'Approve'}
          actionClass="btn-success"
          secondaryAction={(loan) => setRejectModal({ loan, reason: '' })}
          secondaryLabel="Reject"
          emptyMessage="No pending applications"
        />
      )}

      {/* Reject modal */}
      {rejectModal.loan && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center text-xl">❌</div>
              <div>
                <h3 className="font-bold text-white">Reject Loan</h3>
                <p className="text-sm text-slate-400">{rejectModal.loan.borrowerId?.fullName || rejectModal.loan.fullName}</p>
              </div>
            </div>
            <textarea
              className="input-field h-28 resize-none mb-4"
              placeholder="Reason for rejection (required)…"
              value={rejectModal.reason}
              onChange={e => setRejectModal(p => ({ ...p, reason: e.target.value }))}
            />
            <div className="flex gap-3">
              <button className="btn-danger flex-1" onClick={handleReject} disabled={actionLoading}>
                {actionLoading ? 'Rejecting…' : 'Confirm Reject'}
              </button>
              <button className="btn-secondary flex-1" onClick={() => setRejectModal({ loan: null, reason: '' })}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
