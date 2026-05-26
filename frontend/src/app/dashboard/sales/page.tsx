'use client';
import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface Lead {
  _id: string; fullName: string; email: string;
  isProfileComplete: boolean; employmentMode?: string;
  monthlySalary?: number; createdAt: string;
}

export default function SalesPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLeads = async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/users/leads?page=${p}&limit=20`);
      setLeads(data.users);
      setTotalPages(data.pagination.pages);
      setTotal(data.pagination.total);
    } catch { /* handled */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchLeads(page); }, [page]);

  const complete = leads.filter(l => l.isProfileComplete).length;
  const incomplete = leads.length - complete;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Sales — Lead Tracking</h1>
          <p className="text-slate-400 text-sm mt-1">All registered borrowers and their application status</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-white">{total}</p>
          <p className="text-xs text-slate-500">Total leads</p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="stat-card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-lg">✅</div>
          <div>
            <p className="text-xl font-black text-emerald-400">{complete}</p>
            <p className="text-xs text-slate-500">Profile Complete</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-lg">⏳</div>
          <div>
            <p className="text-xl font-black text-amber-400">{incomplete}</p>
            <p className="text-xs text-slate-500">Incomplete Profile</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 animate-pulse" />
            <p className="text-slate-500 text-sm">Loading leads…</p>
          </div>
        </div>
      ) : leads.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">👥</div>
          <p className="text-slate-400 font-medium">No leads yet</p>
          <p className="text-slate-600 text-sm mt-1">Borrowers will appear here once they register</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Borrower</th>
                  <th>Employment</th>
                  <th>Monthly Salary</th>
                  <th>Profile</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => (
                  <tr key={lead._id}>
                    <td>
                      <div>
                        <p className="font-semibold text-white text-sm">{lead.fullName}</p>
                        <p className="text-xs text-slate-500">{lead.email}</p>
                      </div>
                    </td>
                    <td>
                      <span className="capitalize text-slate-300">{lead.employmentMode || '—'}</span>
                    </td>
                    <td>
                      <span className="text-slate-300">
                        {lead.monthlySalary ? `₹${lead.monthlySalary.toLocaleString('en-IN')}` : '—'}
                      </span>
                    </td>
                    <td>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
                        ${lead.isProfileComplete
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-700/50 text-slate-400 border border-slate-600/30'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${lead.isProfileComplete ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                        {lead.isProfileComplete ? 'Complete' : 'Incomplete'}
                      </span>
                    </td>
                    <td>
                      <span className="text-slate-500 text-xs">
                        {new Date(lead.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-3">
          <button className="btn-secondary text-sm px-4 py-2" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
            ← Previous
          </button>
          <span className="text-sm text-slate-400 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700">
            {page} / {totalPages}
          </span>
          <button className="btn-secondary text-sm px-4 py-2" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
