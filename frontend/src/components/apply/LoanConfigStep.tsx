'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { calcLoan, formatCurrency } from '@/lib/bre';

interface Props {
  salarySlipUrl: string;
  salarySlipOriginalName: string;
  onSuccess: (loan: unknown) => void;
}

export default function LoanConfigStep({ salarySlipUrl, salarySlipOriginalName, onSuccess }: Props) {
  const [principal, setPrincipal] = useState(150000);
  const [tenure, setTenure] = useState(180);
  const [loading, setLoading] = useState(false);

  const { simpleInterest, totalRepayment } = calcLoan(principal, tenure);
  const dailyRate = (12 / 365 / 100);
  const effectiveRate = ((simpleInterest / principal) * 100).toFixed(2);

  const handleApply = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/loans/apply', {
        principalAmount: principal, tenureDays: tenure,
        salarySlipUrl, salarySlipOriginalName,
      });
      toast.success('Loan application submitted! 🎉');
      onSuccess(data.loan);
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Application failed');
    } finally {
      setLoading(false);
    }
  };

  const pct = ((principal - 50000) / (500000 - 50000)) * 100;
  const tenurePct = ((tenure - 30) / (365 - 30)) * 100;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Sliders */}
      <div className="lg:col-span-3">
        <div className="card">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white">Configure Your Loan</h2>
            <p className="text-slate-400 text-sm mt-1">Adjust sliders to find the right plan for you</p>
          </div>

          {/* Principal slider */}
          <div className="mb-8">
            <div className="flex justify-between items-end mb-3">
              <div>
                <label className="text-sm font-medium text-slate-400">Loan Amount</label>
                <p className="text-2xl font-black text-white mt-0.5">{formatCurrency(principal)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Range</p>
                <p className="text-xs text-slate-400">₹50K – ₹5L</p>
              </div>
            </div>
            <div className="relative">
              <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-2 rounded-full bg-slate-700 pointer-events-none">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 transition-all duration-150"
                  style={{ width: `${pct}%` }} />
              </div>
              <input type="range" min={50000} max={500000} step={5000} value={principal}
                onChange={e => setPrincipal(Number(e.target.value))}
                className="relative w-full h-2 bg-transparent appearance-none cursor-pointer z-10" />
            </div>
            <div className="flex justify-between text-xs text-slate-600 mt-2">
              <span>₹50,000</span><span>₹5,00,000</span>
            </div>
          </div>

          {/* Tenure slider */}
          <div className="mb-8">
            <div className="flex justify-between items-end mb-3">
              <div>
                <label className="text-sm font-medium text-slate-400">Tenure</label>
                <p className="text-2xl font-black text-white mt-0.5">{tenure} <span className="text-base font-normal text-slate-400">days</span></p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Range</p>
                <p className="text-xs text-slate-400">30 – 365 days</p>
              </div>
            </div>
            <div className="relative">
              <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-2 rounded-full bg-slate-700 pointer-events-none">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-600 to-indigo-500 transition-all duration-150"
                  style={{ width: `${tenurePct}%` }} />
              </div>
              <input type="range" min={30} max={365} step={5} value={tenure}
                onChange={e => setTenure(Number(e.target.value))}
                className="relative w-full h-2 bg-transparent appearance-none cursor-pointer z-10" />
            </div>
            <div className="flex justify-between text-xs text-slate-600 mt-2">
              <span>30 days</span><span>365 days</span>
            </div>
          </div>

          {/* Formula note */}
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <p className="text-xs text-slate-500 font-mono">SI = (P × R × T) / (365 × 100) &nbsp;·&nbsp; Rate: 12% p.a.</p>
          </div>
        </div>
      </div>

      {/* Summary panel */}
      <div className="lg:col-span-2">
        <div className="card sticky top-4">
          <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">Loan Summary</h3>

          {/* Big number */}
          <div className="text-center py-4 mb-4 rounded-xl bg-gradient-to-br from-violet-600/20 to-indigo-600/20 border border-violet-500/20">
            <p className="text-xs text-slate-400 mb-1">Total Repayment</p>
            <p className="text-3xl font-black text-white">{formatCurrency(totalRepayment)}</p>
            <p className="text-xs text-violet-400 mt-1">Principal + Interest</p>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Principal', value: formatCurrency(principal), color: 'text-white' },
              { label: 'Interest (12% p.a.)', value: formatCurrency(simpleInterest), color: 'text-amber-400' },
              { label: 'Tenure', value: `${tenure} days`, color: 'text-slate-300' },
              { label: 'Effective Rate', value: `${effectiveRate}%`, color: 'text-slate-300' },
            ].map(item => (
              <div key={item.label} className="flex justify-between items-center py-2 border-b border-slate-800">
                <span className="text-sm text-slate-400">{item.label}</span>
                <span className={`text-sm font-semibold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>

          <button type="button" className="btn-primary w-full mt-5" onClick={handleApply} disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Submitting…
              </span>
            ) : '🚀 Apply for Loan'}
          </button>

          <p className="text-xs text-slate-600 text-center mt-3">
            By applying you agree to our terms and conditions
          </p>
        </div>
      </div>
    </div>
  );
}
