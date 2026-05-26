'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { getStoredUser, clearAuth } from '@/lib/auth';
import PersonalDetailsStep from '@/components/apply/PersonalDetailsStep';
import SalarySlipStep from '@/components/apply/SalarySlipStep';
import LoanConfigStep from '@/components/apply/LoanConfigStep';
import LoanStatusView from '@/components/apply/LoanStatusView';

const STEPS = [
  { label: 'Personal Details', icon: '👤', desc: 'Eligibility check' },
  { label: 'Salary Slip',      icon: '📄', desc: 'Upload document' },
  { label: 'Loan Config',      icon: '💰', desc: 'Configure & apply' },
];

export default function ApplyPage() {
  const router = useRouter();
  const user = getStoredUser();
  const [step, setStep] = useState(0);
  const [salarySlipUrl, setSalarySlipUrl] = useState('');
  const [salarySlipOriginalName, setSalarySlipOriginalName] = useState('');
  const [existingLoan, setExistingLoan] = useState<unknown>(null);
  const [loadingLoan, setLoadingLoan] = useState(true);

  useEffect(() => {
    api.get('/loans/my').then(({ data }) => {
      if (data.loans?.length > 0) setExistingLoan(data.loans[0]);
    }).catch(() => {}).finally(() => setLoadingLoan(false));
    if (user?.isProfileComplete) setStep(1);
  }, []);

  const handleLogout = () => { clearAuth(); router.push('/auth/login'); };

  if (loadingLoan) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 animate-pulse" />
          <p className="text-slate-400 text-sm">Loading your profile…</p>
        </div>
      </div>
    );
  }

  if (existingLoan) return <LoanStatusView loan={existingLoan} onLogout={handleLogout} />;

  return (
    <div className="min-h-screen bg-slate-950 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative border-b border-slate-800/60 bg-slate-900/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <span className="text-sm font-black text-white">L</span>
            </div>
            <div>
              <p className="font-bold text-white text-sm">LoanFlow</p>
              <p className="text-xs text-slate-500">Loan Application</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white">
                {user?.fullName?.[0]?.toUpperCase()}
              </div>
              <span className="text-sm text-slate-300">{user?.fullName}</span>
            </div>
            <button onClick={handleLogout} className="text-xs text-slate-500 hover:text-rose-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-rose-500/10">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="relative max-w-4xl mx-auto px-4 py-8">
        {/* Step indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            {/* Progress line */}
            <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-800 -z-0">
              <div
                className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all duration-500"
                style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
              />
            </div>

            {STEPS.map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-2 z-10">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold transition-all duration-300
                  ${i < step ? 'bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30' :
                    i === step ? 'bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-violet-500/30 scale-110' :
                    'bg-slate-800 border border-slate-700'}`}>
                  {i < step ? '✓' : s.icon}
                </div>
                <div className="text-center hidden sm:block">
                  <p className={`text-xs font-semibold ${i === step ? 'text-violet-400' : i < step ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {s.label}
                  </p>
                  <p className="text-xs text-slate-600">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="transition-all duration-300">
          {step === 0 && <PersonalDetailsStep onSuccess={() => setStep(1)} />}
          {step === 1 && (
            <SalarySlipStep onSuccess={(url, name) => { setSalarySlipUrl(url); setSalarySlipOriginalName(name); setStep(2); }} />
          )}
          {step === 2 && (
            <LoanConfigStep salarySlipUrl={salarySlipUrl} salarySlipOriginalName={salarySlipOriginalName} onSuccess={setExistingLoan} />
          )}
        </div>
      </main>
    </div>
  );
}
