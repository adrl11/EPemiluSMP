import React, { useState, useEffect } from 'react';
import { db, syncFromSupabase, uploadLocalToSupabase } from '../../lib/storage';
import { saveCustomSupabaseConfig, clearCustomSupabaseConfig, generateShareableConfigUrl } from '../../lib/supabase';
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
  Code,
  UploadCloud,
  Share2,
  Smartphone,
  QrCode,
  ArrowDownCircle,
  ArrowUpCircle,
  Laptop
} from 'lucide-react';

export const SupabaseSettings: React.FC = () => {
  const [supabaseStatus, setSupabaseStatus] = useState(db.getSupabaseStatus());
  const [urlInput, setUrlInput] = useState(supabaseStatus.config.url || '');
  const [keyInput, setKeyInput] = useState(supabaseStatus.config.key || '');
  const [showKey, setShowKey] = useState(false);

  // Test connection state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: Record<string, number | string>;
  } | null>(null);

  // Pull / Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Push / Upload Local state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState<{ success: boolean; message: string } | null>(null);

  // Multi-device share link state
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

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

    await saveCustomSupabaseConfig(urlInput.trim(), keyInput.trim());
    setSaveSuccessMsg(true);
    setTimeout(() => setSaveSuccessMsg(false), 4000);

    const updated = db.getSupabaseStatus();
    setSupabaseStatus(updated);

    // Otomatis test koneksi & sync
    setIsTesting(true);
    const res = await db.testSupabase();
    setTestResult(res);
    setIsTesting(false);

    if (res.success) {
      handleSyncNow();
    }
  };

  const handleResetConfig = async () => {
    if (confirm('Hapus konfigurasi Supabase kustom dan kembali ke mode bawaan?')) {
      await clearCustomSupabaseConfig();
      const updated = db.getSupabaseStatus();
      setSupabaseStatus(updated);
      setUrlInput(updated.config.url);
      setKeyInput(updated.config.key);
      setTestResult(null);
    }
  };

  // 1. Tarik Data dari Cloud Supabase (Pull)
  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await syncFromSupabase();
      setSyncFeedback(res);
      const updated = db.getSupabaseStatus();
      setSupabaseStatus(updated);
      setTimeout(() => setSyncFeedback(null), 5000);
    } catch (err) {
      setSyncFeedback({
        success: false,
        message: `Gagal sinkronisasi: ${(err as Error).message}`,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // 2. Unggah Seluruh Data Lokal ke Cloud Supabase (Push)
  const handleUploadLocal = async () => {
    if (
      !confirm(
        'Unggah seluruh data lokal saat ini (Sekolah, Paslon, Periode, DPT, dan Suara) ke Cloud Supabase? Data di database cloud akan diperbarui sesuai data lokal saat ini.'
      )
    ) {
      return;
    }

    setIsUploading(true);
    setUploadFeedback(null);
    try {
      const res = await uploadLocalToSupabase();
      setUploadFeedback(res);
      setTimeout(() => setUploadFeedback(null), 5000);
    } catch (err) {
      setUploadFeedback({
        success: false,
        message: `Gagal mengunggah: ${(err as Error).message}`,
      });
    } finally {
      setIsUploading(false);
    }
  };

  // 3. Salin Link Multi-Device
  const handleCopyShareLink = () => {
    const link = generateShareableConfigUrl();
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
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
    education_level TEXT DEFAULT 'SMA',
    logo_url TEXT,
    pemda_logo_url TEXT,
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

-- 3. Tabel Susunan Kepanitiaan
CREATE TABLE IF NOT EXISTS public.committees (
    id TEXT PRIMARY KEY,
    election_period_id TEXT REFERENCES public.election_periods(id) ON DELETE CASCADE,
    sk_number TEXT NOT NULL,
    sk_date DATE NOT NULL,
    sk_file_name TEXT,
    member_name TEXT NOT NULL,
    role TEXT NOT NULL,
    email TEXT,
    status TEXT NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'nonaktif')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabel Paslon
CREATE TABLE IF NOT EXISTS public.candidates (
    id TEXT PRIMARY KEY,
    election_period_id TEXT REFERENCES public.election_periods(id) ON DELETE CASCADE,
    ballot_number INT NOT NULL,
    chairman_name TEXT NOT NULL,
    vice_chairman_name TEXT NOT NULL,
    chairman_class TEXT NOT NULL,
    vice_chairman_class TEXT NOT NULL,
    photo_url TEXT,
    vision TEXT NOT NULL,
    mission JSONB NOT NULL DEFAULT '[]'::jsonb,
    programs JSONB NOT NULL DEFAULT '[]'::jsonb,
    video_url TEXT,
    color_theme TEXT DEFAULT 'blue',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabel Pemilih (DPT)
CREATE TABLE IF NOT EXISTS public.voters (
    id TEXT PRIMARY KEY,
    election_period_id TEXT REFERENCES public.election_periods(id) ON DELETE CASCADE,
    nisn TEXT NOT NULL,
    full_name TEXT NOT NULL,
    class_name TEXT NOT NULL,
    gender VARCHAR(2) NOT NULL CHECK (gender IN ('L', 'P')),
    pin_plain TEXT NOT NULL,
    pin_hash TEXT NOT NULL,
    has_voted BOOLEAN NOT NULL DEFAULT FALSE,
    voted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_nisn_per_period UNIQUE (election_period_id, nisn)
);

-- 6. Tabel Brankas Suara (LUBER-JURDIL Anonim)
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
    user_id TEXT,
    user_role TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    ip_address TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Tabel Pengguna Sistem (Akun Portal)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    username TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'panitia', 'operator', 'pengawas')),
    password TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'nonaktif')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- Aktifkan Realtime Replication untuk sinkronisasi instan
ALTER PUBLICATION supabase_realtime ADD TABLE 
  public.schools, 
  public.election_periods, 
  public.committees, 
  public.candidates, 
  public.voters, 
  public.votes, 
  public.audit_logs, 
  public.users;`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(sqlSample);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const shareUrl = typeof window !== 'undefined' ? generateShareableConfigUrl() : '';

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
                  Integrasi Cloud Supabase &amp; Multi-Device Sync
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
                  {supabaseStatus.isActive ? 'Cloud Aktif (Realtime)' : 'Mode Offline / Lokal'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Menyimpan seluruh data (sekolah, paslon, DPT pemilih, suara bilik, dan user panitia) secara permanen di cloud PostgreSQL Supabase dan menyinkronkannya secara langsung ke semua perangkat terhubung tanpa refresh manual.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleSyncNow}
              disabled={isSyncing || !supabaseStatus.isActive}
              title="Tarik data terbaru dari Supabase Cloud ke perangkat ini"
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer shadow-xs"
            >
              <ArrowDownCircle className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Menarik...' : 'Tarik Cloud'}</span>
            </button>
            <button
              onClick={handleUploadLocal}
              disabled={isUploading || !supabaseStatus.isActive}
              title="Unggah data saat ini di perangkat ini ke Supabase Cloud"
              className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer shadow-xs"
            >
              <ArrowUpCircle className={`w-3.5 h-3.5 ${isUploading ? 'animate-spin' : ''}`} />
              <span>{isUploading ? 'Mengunggah...' : 'Unggah ke Cloud'}</span>
            </button>
            <button
              onClick={handleTestConnection}
              disabled={isTesting || !supabaseStatus.config.isConfigured}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-40 cursor-pointer shadow-xs"
            >
              <Zap className={`w-3.5 h-3.5 ${isTesting ? 'animate-bounce' : ''}`} />
              <span>{isTesting ? 'Menguji...' : 'Uji Koneksi'}</span>
            </button>
          </div>
        </div>

        {/* Feedback Messages */}
        {testResult && (
          <div
            className={`mt-4 p-3.5 rounded-xl border text-xs font-semibold ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
            {testResult.details && (
              <div className="mt-2.5 pt-2 border-t border-emerald-200/60 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                {Object.entries(testResult.details).map(([k, v]) => (
                  <div key={k} className="bg-white/80 p-2 rounded-lg border border-emerald-100">
                    <span className="text-slate-500 block">{k}:</span>
                    <span className="font-bold text-slate-800">{String(v)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {syncFeedback && (
          <div
            className={`mt-4 p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              syncFeedback.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`}
          >
            {syncFeedback.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span>{syncFeedback.message}</span>
          </div>
        )}

        {uploadFeedback && (
          <div
            className={`mt-4 p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              uploadFeedback.success
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {uploadFeedback.success ? (
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{uploadFeedback.message}</span>
          </div>
        )}

        {saveSuccessMsg && (
          <div className="mt-4 p-3.5 rounded-xl border bg-emerald-50 border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Kredensial Supabase berhasil disimpan di server dan dibagikan ke seluruh perangkat!</span>
          </div>
        )}
      </div>

      {/* Multi-Device Instant Synchronization Banner */}
      {supabaseStatus.isActive && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-sm border border-blue-800/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-blue-500/20 text-blue-300 rounded-xl border border-blue-400/30 shrink-0">
                <Laptop className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold tracking-tight text-white">
                    Sinkronisasi Otomatis Antar-Perangkat (Multi-Device)
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Otomatis Aktif
                  </span>
                </div>
                <p className="text-xs text-blue-200/90 mt-1 max-w-2xl leading-relaxed">
                  Kredensial database tersimpan di server aplikasi ini. Buka alamat website ini di perangkat lain (laptop panitia, bilik pemilih, atau HP), dan perangkat tersebut akan <strong>otomatis terhubung ke database yang sama</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCopyShareLink}
                className="px-3.5 py-2 rounded-xl bg-white text-slate-900 hover:bg-blue-50 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-700" />}
                <span>{copiedLink ? 'Tautan Tersalin!' : 'Salin Tautan Sinkronisasi'}</span>
              </button>
              <button
                onClick={() => setShowQrModal(!showQrModal)}
                className="px-3.5 py-2 rounded-xl bg-blue-700/60 hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 border border-blue-500/40 transition-all cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>{showQrModal ? 'Tutup QR' : 'QR Scan'}</span>
              </button>
            </div>
          </div>

          {showQrModal && (
            <div className="mt-4 pt-4 border-t border-blue-800/60 flex flex-col sm:flex-row items-center gap-4 bg-blue-950/40 p-4 rounded-xl">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(shareUrl)}`}
                alt="QR Sinkronisasi Supabase"
                className="w-32 h-32 rounded-xl bg-white p-2 shrink-0 shadow-md"
              />
              <div className="text-xs text-blue-200 space-y-1">
                <p className="font-bold text-white text-sm">Pindai dari Ponsel atau Tablet Panitia:</p>
                <p className="leading-relaxed">
                  Arahkan kamera smartphone atau tablet Anda ke QR Code ini. Aplikasi akan langsung membuka dan menghubungkan gawai Anda ke database cloud yang sama tanpa konfigurasi manual.
                </p>
                <p className="font-mono text-[10px] text-blue-300 break-all bg-black/20 p-2 rounded-lg mt-2 select-all">
                  {shareUrl}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

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
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 underline cursor-pointer"
                >
                  Reset Konfigurasi
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Simpan &amp; Terapkan ke Semua Perangkat
                </button>
              </div>
            </form>
          </div>

          {/* Card Penjelasan Mengapa Supabase */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-2xl shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h4 className="text-sm font-bold tracking-tight">
                Bagaimana Sinkronisasi Multi-Perangkat Bekerja?
              </h4>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>
                  <strong>Penyimpanan Pusat (PostgreSQL Cloud):</strong> Setiap kali ada penambahan siswa, pembaruan paslon, atau pembukaan pemungutan suara, data disimpan langsung ke Supabase.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>
                  <strong>Realtime WebSockets:</strong> Supabase mengirimkan sinyal perubahan instan ke seluruh layar (Device 2, Panitia, Bilik Suara, Quick Count) tanpa perlu menekan F5 / refresh halaman.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>
                  <strong>Fitur Unggah &amp; Tarik:</strong> Jika Anda telah mengatur data di laptop utama, gunakan tombol <em>"Unggah ke Cloud"</em> agar seluruh data awal tersimpan di Supabase dan dapat ditarik oleh perangkat lain.
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

            <ol className="space-y-3.5 text-xs">
              <li className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <p className="font-bold text-slate-900">Buat Project Gratis di Supabase</p>
                  <p className="text-slate-500 mt-0.5">
                    Login ke <strong>supabase.com</strong>, klik <strong>New Project</strong>, dan beri nama proyek (misal: <em>epilketos-sekolah</em>).
                  </p>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <p className="font-bold text-slate-900">Jalankan Skrip SQL</p>
                  <p className="text-slate-500 mt-0.5">
                    Buka menu <strong>SQL Editor</strong> di bilah kiri Supabase, klik tombol <strong>Salin Kode Skema SQL</strong> di bawah ini, paste di editor Supabase, lalu klik <strong>RUN</strong>.
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
                    Buka menu <strong>Project Settings &rarr; API</strong> di Supabase, salin <strong>Project URL</strong> dan <strong>anon public key</strong> ke form di samping.
                  </p>
                </div>
              </li>

              <li className="flex gap-3">
                <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  4
                </span>
                <div>
                  <p className="font-bold text-slate-900">Klik "Simpan &amp; Terapkan"</p>
                  <p className="text-slate-500 mt-0.5">
                    Klik tombol simpan. Jika di perangkat ini sudah ada data sekolah/paslon yang Anda buat, klik <strong>"Unggah ke Cloud"</strong> agar semua tersimpan permanen di Supabase.
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
                className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
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
