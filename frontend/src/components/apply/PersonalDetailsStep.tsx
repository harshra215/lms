'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { runClientBRE } from '@/lib/bre';
import { setAuth, getToken, getStoredUser } from '@/lib/auth';

interface Props { onSuccess: () => void; }

export default function PersonalDetailsStep({ onSuccess }: Props) {
  const [form, setForm] = useState({
    fullName: getStoredUser()?.fullName || '',
    pan: '', dateOfBirth: '', monthlySalary: '', employmentMode: '',
  });
  const [loading, setLoading] = useState(false);
  const [breErrors, setBreErrors] = useState<string[]>([]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setBreErrors([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clientResult = runClientBRE({
      dateOfBirth: form.dateOfBirth, monthlySalary: Number(form.monthlySalary),
      pan: form.pan, employmentMode: form.employmentMode,
    });
    if (!clientResult.passed) { setBreErrors(clientResult.errors); return; }
    setLoading(true);
    try {
      const { data } = await api.put('/users/profile', {
        fullName: form.fullName, pan: form.pan.toUpperCase(),
        dateOfBirth: form.dateOfBirth, monthlySalary: Number(form.monthlySalary),
        employmentMode: form.employmentMode,
      });
      setAuth(getToken()!, { ...data.user });
      toast.success('Eligibility check passed! ✓');
      onSuccess();
    } catch (err: unknown) {
      const errData = (err as { response?: { data?: { message?: string; errors?: string[] } } })?.response?.data;
      if (errData?.errors) setBreErrors(errData.errors);
      else toast.error(errData?.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const rules = [
    { label: 'Age 23–50', icon: '🎂' },
    { label: 'Salary ≥ ₹25,000', icon: '💵' },
    { label: 'Valid PAN format', icon: '🪪' },
    { label: 'Employed', icon: '💼' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Eligibility rules sidebar */}
      <div className="lg:col-span-1">
        <div className="card sticky top-4">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-violet-500/20 flex items-center justify-center text-xs">⚡</span>
            Eligibility Rules
          </h3>
          <div className="space-y-3">
            {rules.map((r, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <span className="text-lg">{r.icon}</span>
                <span className="text-sm text-slate-300">{r.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <p className="text-xs text-amber-400">All rules are verified server-side for security.</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="lg:col-span-2">
        <div className="card">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white">Personal Details</h2>
            <p className="text-slate-400 text-sm mt-1">We&apos;ll run an eligibility check on this information</p>
          </div>

          {breErrors.length > 0 && (
            <div className="mb-5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-rose-400">⚠</span>
                <p className="text-sm font-semibold text-rose-400">Eligibility Check Failed</p>
              </div>
              <ul className="space-y-1">
                {breErrors.map((err, i) => (
                  <li key={i} className="text-sm text-rose-300 flex items-start gap-2">
                    <span className="mt-0.5 text-rose-500">•</span>{err}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
                <input name="fullName" type="text" className="input-field" value={form.fullName}
                  onChange={handleChange} placeholder="As per PAN card" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">PAN Number</label>
                <input name="pan" type="text" className="input-field uppercase tracking-widest" value={form.pan}
                  onChange={handleChange} placeholder="ABCDE1234F" maxLength={10} required />
                <p className="text-xs text-slate-600 mt-1">5 letters · 4 digits · 1 letter</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Date of Birth</label>
                <input name="dateOfBirth" type="date" className="input-field" value={form.dateOfBirth}
                  onChange={handleChange} required />
                <p className="text-xs text-slate-600 mt-1">Must be 23–50 years old</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Monthly Salary (₹)</label>
                <input name="monthlySalary" type="number" className="input-field" value={form.monthlySalary}
                  onChange={handleChange} placeholder="e.g. 50000" min={0} required />
                <p className="text-xs text-slate-600 mt-1">Minimum ₹25,000 required</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Employment Mode</label>
                <select name="employmentMode" className="input-field" value={form.employmentMode}
                  onChange={handleChange} required>
                  <option value="">Select type</option>
                  <option value="salaried">Salaried</option>
                  <option value="self-employed">Self-Employed</option>
                  <option value="unemployed">Unemployed</option>
                </select>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Checking eligibility…
                </span>
              ) : 'Check Eligibility & Continue →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
