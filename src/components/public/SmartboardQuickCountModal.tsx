import React, { useState, useEffect } from 'react';
import { Candidate, School, ElectionPeriod, QuickCountStat, ElectionMetrics } from '../../types';
import {
  Maximize2,
  Minimize2,
  X,
  Activity,
  Award,
  Vote,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  BarChart3,
  PieChart,
} from 'lucide-react';
import { AppLogo } from '../common/AppLogo';

interface SmartboardQuickCountModalProps {
  isOpen: boolean;
  onClose: () => void;
  school: School;
  activePeriod: ElectionPeriod | null;
  candidates: Candidate[];
  stats: QuickCountStat[];
  metrics: ElectionMetrics;
  lastUpdated: Date;
  leadingCandidate?: QuickCountStat;
}

export const SmartboardQuickCountModal: React.FC<SmartboardQuickCountModalProps> = ({
  isOpen,
  onClose,
  school,
  activePeriod,
  candidates,
  stats,
  metrics,
  lastUpdated,
  leadingCandidate,
}) => {
  const [chartMode, setChartMode] = useState<'bar' | 'donut'>('bar');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Keyboard shortcut (ESC) & fullscreenchange listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          onClose();
        }
      }
    };

    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFsChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFsChange);
    };
  }, [isOpen, onClose]);

  const toggleNativeFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // Browser may restrict if not directly triggered by user click
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="smartboard-stage-modal"
      className="fixed inset-0 z-50 bg-slate-950/98 text-white flex flex-col overflow-y-auto backdrop-blur-xl animate-in fade-in duration-200"
    >
      {/* Background Ambient Glowing Lights */}
      <div className="absolute top-0 left-1/4 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* TOP BAR / HEADER PANGGUNG SMARTBOARD */}
      <header className="relative z-10 border-b border-slate-800/80 bg-slate-900/60 px-4 sm:px-8 py-3.5 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        {/* Identitas Sekolah & Logo */}
        <div className="flex items-center gap-3 min-w-0">
          {school.pemda_logo_url && (
            <img
              src={school.pemda_logo_url}
              alt="Logo Pemda"
              referrerPolicy="no-referrer"
              className="h-9 sm:h-11 object-contain shrink-0"
            />
          )}
          {school.logo_url && (
            <img
              src={school.logo_url}
              alt="Logo Sekolah"
              referrerPolicy="no-referrer"
              className="h-9 sm:h-11 object-contain shrink-0"
            />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-blue-400">
                {school.agency_name || 'PEMERINTAH DAERAH / DINAS PENDIDIKAN'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-extrabold border border-blue-400/30">
                SMARTBOARD DISPLAY
              </span>
            </div>
            <h1 className="text-sm sm:text-lg font-black text-white truncate">
              {school.name} &bull; {activePeriod?.period_name || 'Rekapitulasi Suara'}
            </h1>
          </div>
        </div>

        {/* Center / Right Control Hub */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap ml-auto">
          {/* Live Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="hidden sm:inline">LIVE REKAPITULASI</span>
            <span className="text-[11px] font-mono opacity-80">
              {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          {/* Toggle Jenis Diagram */}
          <div className="flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setChartMode('bar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                chartMode === 'bar' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Batang</span>
            </button>
            <button
              onClick={() => setChartMode('donut')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                chartMode === 'donut' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              <PieChart className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Lingkaran</span>
            </button>
          </div>

          {/* Native Fullscreen Button */}
          <button
            onClick={toggleNativeFullscreen}
            className="p-2 sm:px-3 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            title={isFullscreen ? 'Keluar dari Fullscreen Browser' : 'Tampilan Layar Penuh Native (F11)'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4 text-amber-400" /> : <Maximize2 className="w-4 h-4 text-blue-400" />}
            <span className="hidden lg:inline">{isFullscreen ? 'Keluar Fullscreen' : 'Layar Penuh'}</span>
          </button>

          {/* Close Modal Button */}
          <button
            onClick={() => {
              if (document.fullscreenElement) {
                document.exitFullscreen().catch(() => {});
              }
              onClose();
            }}
            className="p-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white transition-all shadow-md flex items-center gap-1.5 text-xs font-bold cursor-pointer"
            title="Tutup Tampilan Smartboard (ESC)"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">Tutup</span>
          </button>
        </div>
      </header>

      {/* STAGE MAIN CONTENT */}
      <main className="relative z-10 flex-1 p-4 sm:p-8 flex flex-col justify-between max-w-7xl mx-auto w-full">
        {/* TOP SCOREBOARD / METRICS BAR (ANGKA BESAR JARAK JAUH) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6">
          {/* Suara Masuk */}
          <div className="bg-slate-900/80 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
              <span>Suara Masuk</span>
              <Vote className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-5xl font-black font-mono text-emerald-400">
                {metrics.total_voted.toLocaleString('id-ID')}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-emerald-300">Suara</span>
            </div>
            <div className="text-[11px] text-emerald-400/80 mt-1 font-medium">
              Selesai memilih di bilik suara
            </div>
          </div>

          {/* Total Pemilih (DPT) */}
          <div className="bg-slate-900/80 border border-blue-500/30 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
              <span>Total DPT Siswa</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-5xl font-black font-mono text-blue-400">
                {metrics.total_dpt.toLocaleString('id-ID')}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-blue-300">Pemilih</span>
            </div>
            <div className="text-[11px] text-blue-400/80 mt-1 font-medium">
              Daftar Pemilih Tetap sah
            </div>
          </div>

          {/* Persentase Partisipasi */}
          <div className="bg-gradient-to-br from-indigo-900/90 to-blue-900/90 border border-indigo-400/30 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden backdrop-blur-sm">
            <div className="flex items-center justify-between text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">
              <span>Tingkat Partisipasi</span>
              <Activity className="w-4 h-4 text-indigo-300" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-5xl font-black font-mono text-white">
                {metrics.participation_rate}%
              </span>
            </div>
            {/* Progress Bar */}
            <div className="mt-2 w-full bg-slate-950/60 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${Math.min(metrics.participation_rate, 100)}%` }}
              />
            </div>
          </div>

          {/* Menunggu Antrean (Belum Memilih) */}
          <div className="bg-slate-900/80 border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
              <span>Menunggu Antrean</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-5xl font-black font-mono text-amber-400">
                {metrics.total_unvoted.toLocaleString('id-ID')}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-amber-300">Siswa</span>
            </div>
            <div className="text-[11px] text-amber-400/80 mt-1 font-medium">
              Belum menggunakan hak suara
            </div>
          </div>
        </div>

        {/* DIAGRAM AREA EKSTRA BESAR */}
        <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative flex flex-col justify-between backdrop-blur-md min-h-[440px]">
          {chartMode === 'bar' ? (
            /* MODE 1: DIAGRAM BATANG VERTIKAL SMARTBOARD */
            <div className="flex-1 flex flex-col justify-between relative pt-6 pb-2">
              {/* Y-Axis Guidelines */}
              <div className="absolute inset-0 top-6 bottom-44 flex flex-col justify-between pointer-events-none text-xs font-mono text-slate-500">
                {[100, 75, 50, 25, 0].map((tick) => (
                  <div key={tick} className="flex items-center w-full">
                    <span className="w-10 pr-2 text-right shrink-0 font-bold">{tick}%</span>
                    <div className="flex-1 border-b border-dashed border-slate-800"></div>
                  </div>
                ))}
              </div>

              {/* Columns for Each Candidate */}
              <div className="relative pl-12 pr-4 flex-1 flex items-end">
                <div
                  className="w-full grid gap-4 sm:gap-8 items-end"
                  style={{
                    gridTemplateColumns: `repeat(${stats.length || 1}, minmax(0, 1fr))`,
                  }}
                >
                  {stats.map((cand) => {
                    const isLead =
                      leadingCandidate &&
                      leadingCandidate.candidate_id === cand.candidate_id &&
                      cand.votes_count > 0;
                    const candidateDetail = candidates.find((c) => c.id === cand.candidate_id);

                    return (
                      <div key={cand.candidate_id} className="flex flex-col items-center group">
                        {/* Header Nilai Atas Bar */}
                        <div className="mb-2 text-center flex flex-col items-center justify-end min-h-[60px]">
                          {isLead && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 animate-bounce mb-1">
                              <Award className="w-3.5 h-3.5" />
                              <span>UNGGUL</span>
                            </span>
                          )}
                          <div className="text-2xl sm:text-4xl font-black font-mono tracking-tight text-white drop-shadow-md">
                            {cand.percentage}%
                          </div>
                          <div className="text-xs sm:text-sm font-bold text-slate-400 font-mono">
                            {cand.votes_count.toLocaleString('id-ID')} Suara
                          </div>
                        </div>

                        {/* Tiang Batang Animasi */}
                        <div className="w-full max-w-[120px] sm:max-w-[160px] h-52 sm:h-64 md:h-72 bg-slate-950/80 rounded-2xl p-1.5 flex flex-col justify-end border border-slate-800 relative shadow-inner">
                          <div
                            className="w-full rounded-xl transition-all duration-700 ease-out relative overflow-hidden flex flex-col justify-between items-center py-2"
                            style={{
                              height: `${Math.max(cand.percentage, 5)}%`,
                              backgroundColor: cand.color || '#3b82f6',
                              boxShadow: `0 0 25px ${cand.color || '#3b82f6'}50`,
                            }}
                          >
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/20" />
                            {cand.percentage >= 15 && (
                              <span className="relative z-10 text-xs font-black text-white drop-shadow-md">
                                {cand.percentage}%
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Identitas Paslon Bawah */}
                        <div className="mt-4 flex flex-col items-center text-center w-full max-w-[200px]">
                          {/* Foto Paslon & Badge Nomor Urut */}
                          <div className="relative mb-2.5">
                            <img
                              src={candidateDetail?.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                              alt={cand.chairman_name}
                              referrerPolicy="no-referrer"
                              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-slate-700 shadow-xl group-hover:scale-105 transition-transform"
                            />
                            <div
                              className="absolute -top-2 -right-2 min-w-7 h-7 sm:min-w-8 sm:h-8 px-1.5 rounded-xl font-black text-xs sm:text-sm text-white flex items-center justify-center shadow-lg border-2 border-slate-900"
                              style={{ backgroundColor: cand.color || '#3b82f6' }}
                            >
                              {String(cand.ballot_number || candidateDetail?.ballot_number || 1).padStart(2, '0')}
                            </div>
                          </div>

                          <div className="font-extrabold text-xs sm:text-base text-white line-clamp-1">
                            {cand.chairman_name}
                          </div>
                          {(cand.vice_chairman_name || candidateDetail?.vice_chairman_name) && (
                            <div className="text-[11px] sm:text-xs text-slate-300 line-clamp-1 font-medium">
                              &amp; {cand.vice_chairman_name || candidateDetail?.vice_chairman_name}
                            </div>
                          )}
                          {(candidateDetail?.chairman_class || candidateDetail?.vice_chairman_class) ? (
                            <div className="text-[10px] sm:text-xs text-blue-400 font-bold mt-0.5">
                              {candidateDetail.chairman_class} {candidateDetail.vice_chairman_class && `& ${candidateDetail.vice_chairman_class}`}
                            </div>
                          ) : (
                            <div className="text-[10px] sm:text-xs text-blue-400 font-bold mt-0.5">
                              Paslon No. {String(cand.ballot_number || candidateDetail?.ballot_number || 1).padStart(2, '0')}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* MODE 2: DIAGRAM LINGKARAN BESAR SMARTBOARD */
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 items-center py-6">
              {/* Donut SVG Besar */}
              <div className="flex justify-center items-center">
                <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="transparent" stroke="#1e293b" strokeWidth="16" />
                    {(() => {
                      let cumulativeOffset = 0;
                      const circumference = 2 * Math.PI * 40;
                      return stats.map((cand) => {
                        const strokeDash = (cand.percentage / 100) * circumference;
                        const rotation = (cumulativeOffset / 100) * 360;
                        cumulativeOffset += cand.percentage;

                        return (
                          <circle
                            key={cand.candidate_id}
                            cx="50"
                            cy="50"
                            r="40"
                            fill="transparent"
                            stroke={cand.color}
                            strokeWidth="16"
                            strokeDasharray={`${strokeDash} ${circumference}`}
                            strokeDashoffset={0}
                            transform={`rotate(${rotation} 50 50)`}
                            className="transition-all duration-700"
                          />
                        );
                      });
                    })()}
                  </svg>
                  {/* Pusat Donut */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Suara</span>
                    <span className="text-3xl sm:text-4xl font-black font-mono text-white">
                      {metrics.total_voted.toLocaleString('id-ID')}
                    </span>
                    <span className="text-xs text-emerald-400 font-bold mt-0.5">
                      {metrics.participation_rate}% Partisipasi
                    </span>
                  </div>
                </div>
              </div>

              {/* Rincian Paslon di Sisi Kanan */}
              <div className="space-y-4">
                {stats.map((cand) => {
                  const isLead =
                    leadingCandidate &&
                    leadingCandidate.candidate_id === cand.candidate_id &&
                    cand.votes_count > 0;
                  const candidateDetail = candidates.find((c) => c.id === cand.candidate_id);

                  return (
                    <div
                      key={cand.candidate_id}
                      className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-4 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-xl text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md"
                          style={{ backgroundColor: cand.color }}
                        >
                          {String(cand.ballot_number || candidateDetail?.ballot_number || 1).padStart(2, '0')}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm sm:text-base text-white">
                              {cand.chairman_name}
                            </span>
                            {isLead && (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                                TERBANYAK
                              </span>
                            )}
                          </div>
                          {candidateDetail?.vice_chairman_name && (
                            <div className="text-xs text-slate-400">
                              &amp; {candidateDetail.vice_chairman_name}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xl sm:text-2xl font-black font-mono text-white">
                          {cand.percentage}%
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          {cand.votes_count.toLocaleString('id-ID')} Suara
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* FOOTER PANGGUNG */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <AppLogo variant="monochrome" symbolSize={20} showTagline={false} />
              <span>Sistem E-Voting Pilketos &amp; Pilkosim Digital &bull; LUBER-JURDIL</span>
            </div>
            <div className="text-slate-500">
              Tekan <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">ESC</kbd> untuk kembali ke mode normal
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
