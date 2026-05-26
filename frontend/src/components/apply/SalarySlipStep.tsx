'use client';
import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface Props { onSuccess: (fileUrl: string, originalName: string) => void; }

export default function SalarySlipStep({ onSuccess }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = (selected: File) => {
    if (selected.size > 5 * 1024 * 1024) { toast.error('File size must be under 5 MB'); return; }
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(selected.type)) { toast.error('Only PDF, JPG, and PNG files are allowed'); return; }
    setFile(selected);
    if (selected.type.startsWith('image/')) setPreview(URL.createObjectURL(selected));
    else setPreview(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) processFile(selected);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const selected = e.dataTransfer.files?.[0];
    if (selected) processFile(selected);
  };

  const handleUpload = async () => {
    if (!file) { toast.error('Please select a file first'); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('salarySlip', file);
      const { data } = await api.post('/loans/upload-salary-slip', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Salary slip uploaded! ✓');
      onSuccess(data.fileUrl, data.originalName);
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-white">Upload Salary Slip</h2>
          <p className="text-slate-400 text-sm mt-1">Accepted: PDF, JPG, PNG · Max size: 5 MB</p>
        </div>

        {/* Drop zone */}
        <div
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200
            ${dragOver ? 'border-violet-500 bg-violet-500/10' : file ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/30'}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {preview ? (
            <div className="flex flex-col items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Preview" className="max-h-48 rounded-xl shadow-lg" />
              <p className="text-sm text-emerald-400 font-medium">Image ready to upload</p>
            </div>
          ) : file ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
                <span className="text-3xl">📄</span>
              </div>
              <div>
                <p className="font-semibold text-white">{file.name}</p>
                <p className="text-sm text-slate-400">{(file.size / 1024).toFixed(1)} KB · PDF Document</p>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400 text-sm">
                <span>✓</span> File ready to upload
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-200
                ${dragOver ? 'bg-violet-500/30 scale-110' : 'bg-slate-800'}`}>
                <span className="text-3xl">{dragOver ? '📥' : '📁'}</span>
              </div>
              <div>
                <p className="font-semibold text-white">Drop your file here</p>
                <p className="text-sm text-slate-400 mt-1">or <span className="text-violet-400">click to browse</span></p>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700">PDF</span>
                <span className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700">JPG</span>
                <span className="px-2 py-1 rounded-lg bg-slate-800 border border-slate-700">PNG</span>
                <span>· Max 5 MB</span>
              </div>
            </div>
          )}
          <input ref={inputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileChange} />
        </div>

        {file && (
          <div className="mt-3 flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {file.name}
            </div>
            <button type="button" className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
              onClick={() => { setFile(null); setPreview(null); }}>
              Remove
            </button>
          </div>
        )}

        <button type="button" className="btn-primary w-full mt-6" onClick={handleUpload} disabled={!file || loading}>
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Uploading…
            </span>
          ) : 'Upload & Continue →'}
        </button>
      </div>
    </div>
  );
}
