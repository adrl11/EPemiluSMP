import React, { useState, useEffect } from 'react';
import { db } from '../../lib/storage';
import { saveCustomSupabaseConfig, clearCustomSupabaseConfig } from '../../lib/supabase';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Server,
  Zap,
  HelpCircle,
  Eye,
  EyeOff,
  Code
} from 'lucide-react';

export const SupabaseSettings: React.FC = () => {
  const [supabaseStatus, setSupabaseStatus] = useState(db.getSupabaseStatus());
  const [urlInput, setUrlInput] = useState(supabaseStatus.config.url || '');
  const [keyInput, setKeyInput] = useState(supabaseStatus.config.key || '');
  const [showKey, setShowKey] = useState(false);

  // Test connection state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState<boolean | null>(null);

  // Copy SQL state
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlViewer, setShowSqlViewer] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  useEffect(() => {
    const current = db.getSupabaseStatus();
    setSupabaseStatus(current);
    setUrlInput(current.config.url);
    setKeyInput(current.config.key);
  }, []);

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await db.testSupabase();
      setTestResult(res);
      setSupabaseStatus(db.getSupabaseStatus());
    } catch (err) {
      setTestResult({
        success: false,
        message: `Terjadi kendala koneksi: ${(err as Error).message}`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim() || !keyInput.trim()) {
      alert('Mohon isi Project URL dan Anon Key Supabase Anda!');
      return;
    }

    if (!urlInput.startsWith('http')) {
      alert('URL harus berawalan https://');
      return;
    }

    saveCustomSupabaseConfig(urlInput.trim(), keyInput.trim());
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 3500);

    const updated = db.getSupabaseStatus();
    setSupabaseStatus(updated);

    // Otomatis test koneksi
    setIsTesting(true);
    const res = await db.testSupabase();
    setTestResult(res);
    setIsTesting(false);
  };

  const handleResetConfig = () => {
    if (confirm('Hapus konfigurasi Supabase kustom dan kembali ke mode bawaan?')) {
      clearCustomSupabaseConfig();
      const updated = db.getSupabaseStatus();
      setSupabaseStatus(updated);
      setUrlInput(updated.config.url);
      setKeyInput(updated.config.key);
      setTestResult(null);
    }
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncSuccess(null);
    try {
      const ok = await db.syncFromSupabase();
      setSyncSuccess(ok);
      setTimeout(() => setSyncSuccess(null), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  const sqlSample = `-- ==============================================================================
-- SKEMA LENGKAP SUPABASE (POSTGRESQL) - E-PILKETOS DIGITAL
-- Salin seluruh skema ini ke menu SQL Editor di Supabase Anda, lalu klik RUN.
-- File lengkap juga dapat diakses pada berkas: /supabase_schema.sql
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabel Profil Sekolah
CREATE TABLE IF NOT EXISTS public.schools (
    id TEXT PRIMARY KEY DEFAULT 'sch-01',
    name TEXT NOT NULL,
    npsn TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'OSIS',
    logo_url TEXT,
    address TEXT NOT NULL,
    principal_name TEXT NOT NULL,
    principal_nip TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel Periode Pemilihan
CREATE TABLE IF NOT EXISTS public.election_periods (
    id TEXT PRIMARY KEY,
    school_id TEXT REFERENCES public.schools(id) ON DELETE CASCADE,
    period_name TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'aktif', 'selesai')),
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabel SK & Panitia
CREATE TABLE IF NOT EXISTS public.committees (
    id TEXT PRIMARY KEY,
    election_period_id TEXT REFERENCES public.election_periods(id) ON DELETE CASCADE,
    sk_number TEXT NOT NULL,
    sk_date DATE NOT NULL,
    sk_file_name TEXT,
    member_name TEXT NOT NULL,
    role TEXT NOT NULL,
    email TEXT,
    status TEXT NOT NULL DEFAULT 'aktif',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabel Kandidat Paslon
CREATE TABLE IF NOT EXISTS public.candidates (
    id TEXT PRIMARY KEY,
    election_period_id TEXT REFERENCES public.election_periods(id) ON DELETE CASCADE,
    ballot_number INT NOT NULL,
    chairman_name TEXT NOT NULL,
    chairman_class TEXT NOT NULL,
    vice_chairman_name TEXT NOT NULL,
    vice_chairman_class TEXT NOT NULL,
    photo_url TEXT,
    vision TEXT NOT NULL,
    mission TEXT NOT NULL,
    quote TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabel Pemilih (DPT Siswa)
CREATE TABLE IF NOT EXISTS public.voters (
    id TEXT PRIMARY KEY,
    election_period_id TEXT REFERENCES public.election_periods(id) ON DELETE CASCADE,
    nisn TEXT NOT NULL,
    full_name TEXT NOT NULL,
    class_name TEXT NOT NULL,
    gender TEXT NOT NULL,
    pin_plain TEXT NOT NULL,
    pin_hash TEXT NOT NULL,
    has_voted BOOLEAN DEFAULT FALSE,
    voted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_voter_period_nisn UNIQUE (election_period_id, nisn)
);

-- 6. Tabel Suara Anonim
CREATE TABLE IF NOT EXISTS public.votes (
    id TEXT PRIMARY KEY,
    election_period_id TEXT REFERENCES public.election_periods(id) ON DELETE CASCADE,
    candidate_id TEXT REFERENCES public.candidates(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabel Audit Trail Sistem
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    election_period_id TEXT,
    user_id TEXT NOT NULL,
    user_role TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    ip_address TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tabel Pengguna Sistem (Akun Portal)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'panitia', 'saksi', 'pengawas', 'kepala_sekolah')),
    status TEXT NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'nonaktif')),
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aktifkan Realtime Replication untuk sinkronisasi instan
ALTER PUBLICATION supabase_realtime ADD TABLE public.schools;
ALTER PUBLICATION supabase_realtime ADD TABLE public.election_periods;
ALTER PUBLICATION supabase_realtime ADD TABLE public.candidates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.voters;
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.committees;
ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSample);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Info */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 shrink-0">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">
                  Integrasi Database Cloud Supabase
                </h3>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold flex items-center gap-1 ${
                    supabaseStatus.isActive
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      supabaseStatus.isActive ? 'bg-emerald-600 animate-pulse' : 'bg-amber-500'
                    }`}
                  />
                  {supabaseStatus.isActive ? 'Cloud Aktif & Terhubung' : 'Mode Offline / Lokal'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Menjadikan seluruh data sekolah, periode pemilihan, DPT siswa, suara bilik pemilih, dan akun pengguna tersimpan secara permanen di database cloud PostgreSQL Supabase. Perubahan data tidak akan hilang saat laptop dimatikan atau browser di-refresh.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSyncNow}
              disabled={isSyncing || !supabaseStatus.isActive}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Menyinkronkan...' : 'Tarik Data Supabase'}</span>
            </button>
            <button
              onClick={handleTestConnection}
              disabled={isTesting || !supabaseStatus.config.isConfigured}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer shadow-xs"
            >
              <Zap className={`w-3.5 h-3.5 ${isTesting ? 'animate-bounce' : ''}`} />
              <span>{isTesting ? 'Menguji...' : 'Uji Koneksi'}</span>
            </button>
          </div>
        </div>

        {/* Feedback Messages */}
        {testResult && (
          <div
            className={`mt-4 p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}

        {syncSuccess !== null && (
          <div
            className={`mt-4 p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              syncSuccess
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              {syncSuccess
                ? 'Sinkronisasi berhasil! Data terbaru dari Supabase telah dimuat ke antarmuka aplikasi.'
                : 'Gagal menyinkronkan data. Pastikan tabel di Supabase sudah dibuat.'}
            </span>
          </div>
        )}

        {saveSuccessMsg && (
          <div className="mt-4 p-3.5 rounded-xl border bg-emerald-50 border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Kredensial Supabase berhasil disimpan dan diaktifkan.</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri: Form Konfigurasi Kredensial */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h4 className="text-sm font-black text-slate-900 mb-1 flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-600" />
              Kredensial Koneksi API
            </h4>
            <p className="text-xs text-slate-500 mb-5">
              Dapatkan data ini di dashboard Supabase Anda melalui menu <strong>Project Settings &rarr; API</strong>.
            </p>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Project URL Supabase
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://abcdefghijklmnop.supabase.co"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50/50"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Contoh: https://your-project-id.supabase.co
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Project API Key (anon / public)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                  >
                    {showKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showKey ? 'Sembunyikan' : 'Tampilkan'}</span>
                  </button>
                </div>
                <input
                  type={showKey ? 'text' : 'password'}
                  required
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-slate-50/50"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Gunakan key bertipe <strong>anon public</strong>, bukan service_role.
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleResetConfig}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 underline"
                >
                  Reset Konfigurasi
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                >
                  Simpan &amp; Hubungkan
                </button>
              </div>
            </form>
          </div>

          {/* Card Penjelasan Mengapa Supabase */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h4 className="text-sm font-bold tracking-tight">
                Mengapa Supabase Menjadi Solusi Permanen?
              </h4>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>
                  <strong>Data Persisten di Server Cloud:</strong> Seluruh modifikasi nama sekolah, foto paslon, impor NISN, dan suara bilik tersimpan di database PostgreSQL terpusat, bukan hanya di cache browser laptop.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>
                  <strong>Sinkronisasi Antar-Perangkat (Realtime):</strong> Saat siswa memilih di laptop bilik suara, hasil quick count di proyektor aula langsung bertambah secara otomatis tanpa perlu refresh manual.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>
                  <strong>Dua Lapis Keandalan (Hybrid):</strong> Aplikasi tetap memiliki salinan lokal instan sehingga operasi tetap cepat dan aman saat koneksi internet sekolah mengalami fluktuasi sementara.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Kolom Kanan: Panduan Langkah demi Langkah */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-emerald-600" />
                Panduan Setup 3 Menit
              </h4>
              <a
                href="https://supabase.com"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <span>Buka Supabase</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <ol className="space-y-3.5 text-xs text-slate-600">
              <li className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <p className="font-bold text-slate-900">Buat Project Gratis</p>
                  <p className="text-slate-500 mt-0.5">
                    Daftar di <strong>supabase.com</strong>, klik <em>New Project</em>, beri nama (misal: <code>epilketos-osis</code>), lalu buat password database.
                  </p>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <p className="font-bold text-slate-900">Jalankan Skema SQL</p>
                  <p className="text-slate-500 mt-0.5">
                    Di dashboard Supabase, klik menu <strong>SQL Editor</strong> &rarr; <em>New Query</em>. Salin kode SQL di bawah ini lalu klik <strong>Run</strong>.
                  </p>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <p className="font-bold text-slate-900">Salin URL &amp; Anon Key</p>
                  <p className="text-slate-500 mt-0.5">
                    Masuk ke menu <strong>Project Settings &rarr; API</strong>, salin <em>Project URL</em> dan <em>anon public key</em> ke formulir di samping kiri.
                  </p>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  4
                </span>
                <div>
                  <p className="font-bold text-slate-900">Selesai!</p>
                  <p className="text-slate-500 mt-0.5">
                    Klik <strong>Uji Koneksi</strong>. Seluruh data pemilihan akan langsung tersimpan permanen di cloud.
                  </p>
                </div>
              </li>
            </ol>

            {/* Tombol Salin SQL */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={handleCopySql}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Kode SQL Tersalin!' : 'Salin Kode Skema SQL'}</span>
              </button>

              <button
                onClick={() => setShowSqlViewer(!showSqlViewer)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                <Code className="w-3.5 h-3.5" />
                <span>{showSqlViewer ? 'Tutup Pratinjau' : 'Lihat Skema'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SQL Script Viewer */}
      {showSqlViewer && (
        <div className="bg-slate-900 text-slate-200 p-6 rounded-2xl border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-emerald-400" />
              <h5 className="text-xs font-mono font-bold text-white">
                supabase_schema.sql (PostgreSQL)
              </h5>
            </div>
            <button
              onClick={handleCopySql}
              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5"
            >
              {copiedSql ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copiedSql ? 'Tersalin' : 'Salin'}</span>
            </button>
          </div>
          <pre className="p-4 bg-slate-950 rounded-xl text-[11px] font-mono overflow-x-auto max-h-80 scrollbar-thin text-slate-300">
            {sqlSample}
          </pre>
        </div>
      )}
    </div>
  );
};
