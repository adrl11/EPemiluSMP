import React, { useState, useEffect } from 'react';
import { School, ElectionPeriod, Candidate, Voter } from '../../types';
import { db } from '../../lib/storage';
import confetti from 'canvas-confetti';
import {
  Vote,
  Lock,
  User,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  LogOut,
  Check,
  RotateCcw,
} from 'lucide-react';
import { CandidateDetailModal } from '../public/CandidateDetailModal';
import { AppLogo } from '../common/AppLogo';

interface BilikSuaraProps {
  school: School;
  activePeriod: ElectionPeriod | null;
  onExitToPublic: () => void;
}

type VotingStep = 'AUTH' | 'BALLOT' | 'SUCCESS';

export const BilikSuara: React.FC<BilikSuaraProps> = ({
  school,
  activePeriod,
  onExitToPublic,
}) => {
  // Authentication State
  const [nisnInput, setNisnInput] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Authenticated Student State
  const [currentVoter, setCurrentVoter] = useState<Voter | null>(null);

  // Voting State
  const [currentStep, setCurrentStep] = useState<VotingStep>('AUTH');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [detailModalCand, setDetailModalCand] = useState<Candidate | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Countdown for auto-logout
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (activePeriod) {
      setCandidates(db.getCandidates(activePeriod.id));
    }
  }, [activePeriod]);

  // Handle countdown on success screen
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (currentStep === 'SUCCESS' && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (currentStep === 'SUCCESS' && countdown === 0) {
      handleResetBooth();
    }
    return () => clearTimeout(timer);
  }, [currentStep, countdown]);

  const handleResetBooth = () => {
    setNisnInput('');
    setPinInput('');
    setAuthError(null);
    setCurrentVoter(null);
    setSelectedCandidate(null);
    setConfirmModalOpen(false);
    setCurrentStep('AUTH');
    setCountdown(5);
  };

  // Verifikasi Kredensial Siswa
  const handleAuthenticate = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAuthError(null);

    if (!activePeriod || activePeriod.status !== 'aktif') {
      setAuthError('Pemungutan suara belum dibuka atau periode pemilihan sedang tidak aktif (Draft/Selesai). Silakan hubungi Panitia Pemilihan.');
      return;
    }

    if (!nisnInput.trim() || !pinInput.trim()) {
      setAuthError('Harap lengkapi NISN dan Kode PIN pemilih Anda.');
      return;
    }

    setIsVerifying(true);

    setTimeout(() => {
      const voters = db.getVoters(activePeriod.id);
      const voter = voters.find((v) => v.nisn.trim() === nisnInput.trim());

      if (!voter) {
        setAuthError('NISN tidak terdaftar dalam Daftar Pemilih Tetap (DPT) periode ini. Silakan hubungi Panitia Pemilihan.');
        setIsVerifying(false);
        return;
      }

      // Verifikasi PIN
      const isPinMatch =
        voter.pin_plain.toUpperCase() === pinInput.trim().toUpperCase() ||
        voter.pin_hash.toUpperCase() === pinInput.trim().toUpperCase();

      if (!isPinMatch) {
        setAuthError('Token PIN yang Anda masukkan tidak cocok dengan data pemilih. Pastikan huruf kapital sesuai kartu token!');
        setIsVerifying(false);
        return;
      }

      // Cek apakah sudah memilih
      if (voter.has_voted) {
        setAuthError(
          `Hak suara atas nama ${voter.full_name} (${voter.nisn}) telah tercatat sudah digunakan pada ${
            voter.voted_at ? new Date(voter.voted_at).toLocaleTimeString('id-ID') : 'sebelumnya'
          }. Setiap siswa hanya berhak memilih satu kali!`
        );
        setIsVerifying(false);
        return;
      }

      // Berhasil
      setCurrentVoter(voter);
      setCurrentStep('BALLOT');
      setIsVerifying(false);
    }, 400);
  };

  // Buka Modal Konfirmasi Pilihan
  const handleSelectCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setConfirmModalOpen(true);
  };

  // Submit Suara Atomik
  const handleConfirmVote = async () => {
    if (!currentVoter || !selectedCandidate || !activePeriod) return;

    setIsSubmitting(true);
    try {
      const res = await db.castVote(
        currentVoter.nisn,
        currentVoter.pin_plain,
        selectedCandidate.id
      );

      if (res.success) {
        // Trigger celebratory confetti
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });

        setConfirmModalOpen(false);
        setCurrentStep('SUCCESS');
        setCountdown(5);
      } else {
        alert(res.message);
      }
    } catch {
      alert('Terjadi kesalahan saat mencatat suara. Silakan coba kembali.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Kiosk Mode Navigation Bar */}
      <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-200 mb-6 shadow-xs">
        <div className="flex items-center gap-3">
          <AppLogo variant="icon" size={32} />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-900 leading-tight">
                E-PILEKTOS DIGITAL
              </span>
              <span className="text-[10px] uppercase font-bold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded">
                Bilik Suara
              </span>
            </div>
            <span className="text-[11px] text-slate-500">
              {school.name} &bull; {activePeriod?.academic_year || 'Belum Ada Periode'}
              {activePeriod?.status === 'draft' && (
                <span className="ml-1.5 text-amber-600 font-semibold">(Tahap Persiapan)</span>
              )}
              {activePeriod?.status === 'selesai' && (
                <span className="ml-1.5 text-slate-500 font-semibold">(Pemilihan Selesai)</span>
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {currentStep === 'BALLOT' && (
            <button
              onClick={handleResetBooth}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Batal &amp; Keluar</span>
            </button>
          )}

          {currentStep === 'AUTH' && (
            <button
              onClick={onExitToPublic}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Kembali ke Beranda
            </button>
          )}
        </div>
      </div>

      {/* STEP 1: OTENTIKASI SISWA */}
      {currentStep === 'AUTH' && (
        <div className="space-y-6">
          {!activePeriod ? (
            /* Belum ada periode pemilihan */
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-8 sm:p-12 text-center max-w-2xl mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto mb-4 text-rose-600">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-2">
                Bilik Suara Belum Dikonfigurasi
              </h2>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Belum ada periode pemilihan yang dibuat atau disetel oleh Administrator/Panitia.
                Bilik suara belum dapat digunakan oleh siswa sampai periode pemilihan dikonfigurasi.
              </p>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 mb-6 text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Status Bilik Suara:</span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">Nonaktif / Belum Ada Periode</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Instansi / Sekolah:</span>
                  <span>{school.name}</span>
                </div>
              </div>
              <button
                onClick={onExitToPublic}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                Kembali ke Halaman Beranda
              </button>
            </div>
          ) : activePeriod.status === 'draft' ? (
            /* Periode masih berstatus DRAFT / TAHAP PERSIAPAN */
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-8 sm:p-12 text-center max-w-2xl mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4 text-amber-600">
                <Clock className="w-8 h-8" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold uppercase tracking-wider mb-3">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Tahap Persiapan (Draft)
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-2">
                Pemungutan Suara Belum Dibuka
              </h2>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Periode pemilihan saat ini sedang dalam tahap persiapan data (DPT, Paslon, dan Jadwal) oleh Panitia Pemilihan.
                Bilik suara elektronik akan dibuka secara resmi setelah panitia atau admin mengaktifkan status periode pemilihan.
              </p>
              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs text-slate-700 mb-6 text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Nama Periode:</span>
                  <span className="font-bold text-slate-900">{activePeriod.period_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Tahun Ajaran:</span>
                  <span>{activePeriod.academic_year}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Status Periode:</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold text-[11px]">Draft / Persiapan</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Akses Bilik Suara:</span>
                  <span className="text-rose-600 font-semibold">Terkunci (Belum Dimulai)</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={onExitToPublic}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Kembali ke Live Quick Count
                </button>
              </div>
            </div>
          ) : activePeriod.status === 'selesai' ? (
            /* Periode sudah SELESAI */
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden p-8 sm:p-12 text-center max-w-2xl mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-4 text-slate-600">
                <Lock className="w-8 h-8" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold uppercase tracking-wider mb-3">
                Pemilihan Telah Selesai
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-2">
                Pemungutan Suara Telah Ditutup
              </h2>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Proses pemungutan suara untuk periode <strong>{activePeriod.period_name}</strong> telah resmi ditutup.
                Siswa tidak dapat lagi mengirimkan suara. Silakan lihat hasil akhir rekapitulasi pada menu Live Quick Count.
              </p>
              <button
                onClick={onExitToPublic}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                Lihat Hasil di Live Quick Count
              </button>
            </div>
          ) : (
            /* Periode AKTIF: Tampilkan Form Otentikasi Siswa */
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
              {/* Header Otentikasi */}
              <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-6 sm:p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
                <AppLogo variant="icon" size={48} className="mx-auto mb-3 shadow-lg" />
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Bilik Suara Siswa &bull; Masuk Pemilih
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto mt-1">
                  Masukkan Nomor Induk Siswa Nasional (NISN) dan 6-digit Kode Token PIN yang tertera pada kartu suara Anda.
                </p>
              </div>

              {/* Form Input */}
              <form onSubmit={handleAuthenticate} className="p-6 sm:p-8 space-y-5">
                {authError && (
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Peringatan Akses:</span>
                      <span>{authError}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Nomor Induk Siswa Nasional (NISN)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        maxLength={10}
                        value={nisnInput}
                        onChange={(e) => setNisnInput(e.target.value.replace(/\D/g, ''))}
                        placeholder="Contoh: 0061234503 (10 digit)"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 font-mono text-base tracking-wider text-slate-900 transition-all"
                        required
                      />
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      10 digit nomor NISN resmi dari Dapodik/Kemenag
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Kode Token PIN Pemilih (6 Karakter)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        maxLength={6}
                        value={pinInput}
                        onChange={(e) => setPinInput(e.target.value.toUpperCase())}
                        placeholder="Contoh: PIL003"
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 font-mono text-base tracking-widest text-slate-900 uppercase transition-all"
                        required
                      />
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Token rahasia acak sekali pakai yang dibagikan panitia bilik
                    </span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isVerifying ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Memvalidasi Data Pemilih...</span>
                    </>
                  ) : (
                    <>
                      <span>Verifikasi &amp; Buka Surat Suara</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* STEP 2: BILIK SURAT SUARA DIGITAL */}
      {currentStep === 'BALLOT' && currentVoter && (
        <div className="space-y-6">
          {/* Identity Bar */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shrink-0">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] uppercase tracking-wider text-emerald-800 font-bold">
                  Pemilih Terverifikasi
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  {currentVoter.full_name} &bull; Kelas {currentVoter.class_name}
                </h3>
                <span className="font-mono text-slate-500 text-[11px]">
                  NISN: {currentVoter.nisn}
                </span>
              </div>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Hak Suara Aktif (1 Suara)</span>
            </div>
          </div>

          {/* Surat Suara Header */}
          <div className="text-center py-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              SURAT SUARA ELEKTRONIK
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl mx-auto">
              Silakan periksa pasangan calon di bawah ini. Klik tombol{' '}
              <strong className="text-emerald-700">&quot;Pilih Paslon Ini&quot;</strong> pada calon yang Anda yakini.
            </p>
          </div>

          {/* Grid Paslon Surat Suara */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {candidates.map((cand) => (
              <div
                key={cand.id}
                className="bg-white rounded-2xl border-2 border-slate-200 hover:border-emerald-500 shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Nomor Urut Jumbo */}
                  <div className="bg-slate-900 text-white py-3 text-center border-b border-slate-800">
                    <span className="text-xs uppercase tracking-widest text-slate-400 font-bold block">
                      NOMOR URUT
                    </span>
                    <span className="text-3xl font-black font-mono text-white tracking-wider">
                      0{cand.ballot_number}
                    </span>
                  </div>

                  {/* Foto Paslon */}
                  <div className="aspect-4/3 bg-slate-100 overflow-hidden relative">
                    <img
                      src={cand.photo_url}
                      alt={cand.chairman_name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Biodata */}
                  <div className="p-4 space-y-3">
                    <div className="border-b border-slate-100 pb-2">
                      <div className="text-[11px] font-bold text-blue-600 uppercase">
                        Calon Ketua &bull; {cand.chairman_class}
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 leading-snug">
                        {cand.chairman_name}
                      </h4>
                    </div>

                    <div className="border-b border-slate-100 pb-2">
                      <div className="text-[11px] font-bold text-indigo-600 uppercase">
                        Calon Wakil Ketua &bull; {cand.vice_chairman_class}
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 leading-snug">
                        {cand.vice_chairman_name}
                      </h4>
                    </div>

                    <div className="text-xs text-slate-600 italic line-clamp-2">
                      &ldquo;{cand.vision}&rdquo;
                    </div>

                    <button
                      type="button"
                      onClick={() => setDetailModalCand(cand)}
                      className="text-[11px] font-semibold text-blue-600 hover:underline block pt-1"
                    >
                      Baca Visi &amp; Misi Lengkap &rarr;
                    </button>
                  </div>
                </div>

                {/* Tombol Pilih */}
                <div className="p-4 pt-0">
                  <button
                    type="button"
                    onClick={() => handleSelectCandidate(cand)}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Vote className="w-4 h-4" />
                    <span>PILIH PASLON 0{cand.ballot_number}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: SUKSES & COUNTDOWN LOGOUT */}
      {currentStep === 'SUCCESS' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-8 sm:p-12 text-center max-w-lg mx-auto animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-inner">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Suara Anda Berhasil Disimpan!
          </h2>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Terima kasih telah menggunakan hak suara Anda secara demokratis. Pilihan Anda dicatat secara anonim dan terenkripsi demi menjaga kerahasiaan suara (LUBER-JURDIL).
          </p>

          <div className="mt-8 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center gap-2 text-xs text-slate-600">
            <Clock className="w-4 h-4 text-emerald-600 animate-spin" />
            <span>
              Layar akan otomatis kembali dalam{' '}
              <strong className="text-emerald-700 font-mono text-sm">{countdown} detik</strong>
            </span>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleResetBooth}
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Selesai (Pemilih Berikutnya)</span>
            </button>
            <button
              onClick={onExitToPublic}
              className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
            >
              Lihat Quick Count
            </button>
          </div>
        </div>
      )}

      {/* Modal Dialog Konfirmasi Pilihan Suara */}
      {confirmModalOpen && selectedCandidate && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="bg-amber-500 text-slate-950 p-5 text-center">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2">
                <AlertCircle className="w-6 h-6 text-slate-950" />
              </div>
              <h3 className="font-extrabold text-lg">Konfirmasi Pilihan Anda</h3>
              <p className="text-xs text-amber-950 font-medium mt-0.5">
                Pilihan suara tidak dapat diubah setelah dikonfirmasi!
              </p>
            </div>

            <div className="p-6 text-center space-y-4">
              <div className="w-24 h-24 rounded-2xl overflow-hidden mx-auto shadow-md border-2 border-slate-300">
                <img
                  src={selectedCandidate.photo_url}
                  alt={selectedCandidate.chairman_name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <span className="text-xs font-mono font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                  PASLON NOMOR 0{selectedCandidate.ballot_number}
                </span>
                <h4 className="font-bold text-base text-slate-900 mt-2">
                  {selectedCandidate.chairman_name}
                </h4>
                <p className="text-xs text-slate-500 font-medium">
                  &amp; {selectedCandidate.vice_chairman_name}
                </p>
              </div>

              <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                Apakah Anda yakin dengan pilihan Anda? Klik tombol hijau di bawah ini untuk mengunci suara Anda secara resmi.
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setConfirmModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
                >
                  Ubah Pilihan
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmVote}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  {isSubmitting ? (
                    <span>Menyimpan...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Ya, Kirimkan Suara</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Detail Modal */}
      <CandidateDetailModal
        candidate={detailModalCand}
        onClose={() => setDetailModalCand(null)}
      />
    </div>
  );
};
