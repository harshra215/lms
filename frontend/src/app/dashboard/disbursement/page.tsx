'use client';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import LoanTable, { LoanRow } from '@/components/dashboard/LoanTable';

export default function DisbursementPage() {
  const [loans, setLoans] = useState<LoanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/loans/sanctioned');
      setLoans(data.loans);
    } catch { /* handled */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchLoans(); }, []);

  const handleDisburse = async (loan: LoanRow) => {
    if (!confirm(`Disburse funds for ${loan.borrowerId?.fullName || loan.fullName}?`)) return;
    setActionLoading(true);
    try {
      await api.patch(`/loans/${loan._id}/disburse`);
      toast.success('Loan disbursed successfully 💸');
      fetchLoans();
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed');
    } finally { setActionLoading(false); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Disbursement</h1>
          <p className="text-slate-400 text-sm mt-1">Mark sanctioned loans as disbursed (funds released)</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-sm font-semibold text-blue-400">{loans.length} ready</span>
        </div>
      </div>

      {loading ? (
        <div className="card flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 animate-pulse" />
            <p className="text-slate-500 text-sm">Loading sanctioned loans…</p>
          </div>
        </div>
      ) : (
        <LoanTable
          loans={loans}
          onAction={handleDisburse}
          actionLabel={actionLoading ? '…' : '💸 Disburse'}
          actionClass="btn-primary"
          emptyMessage="No sanctioned loans awaiting disbursement"
        />
      )}
    </div>
  );
}
