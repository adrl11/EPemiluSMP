import React, { useState, useEffect } from 'react';
import { Candidate, School, ElectionPeriod, QuickCountStat, ElectionMetrics } from '../../types';
import { db, realtimeBus } from '../../lib/storage';
import {
  Users,
  CheckCircle2,
  Clock3,
  TrendingUp,
  Award,
  Vote,
  ExternalLink,
  Shield,
  Activity,
  Sparkles,
} from 'lucide-react';
import { CandidateDetailModal } from './CandidateDetailModal';

interface LiveQuickCountProps {
  school: School;
  activePeriod: ElectionPeriod | null;
  onGoToBilikSuara: () => void;
}

export const LiveQuickCount: React.FC<LiveQuickCountProps> = ({
  school,
  activePeriod,
  onGoToBilikSuara,
}) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [stats, setStats] = useState<QuickCountStat[]>([]);
  const [metrics, setMetrics] = useState<ElectionMetrics>({
    total_dpt: 0,
    total_voted: 0,
    total_unvoted: 0,
    participation_rate: 0,
  });
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'bar' | 'donut'>('bar');

  const refreshData = () => {
    if (!activePeriod) return;
    const cands = db.getCandidates(activePeriod.id);
    const { candidates: candidateStats, metrics: m } = db.getQuickCountStats(activePeriod.id);
    setCandidates(cands);
    setStats(candidateStats);
    setMetrics(m);
    setLastUpdated(new Date());
  };

  useEffect(() => {
    refreshData();

    // Listen to real-time events
    const handleVoteCasted = () => refreshData();
    const handleDataReset = () => refreshData();
    const handlePeriodUpdate = () => refreshData();

    realtimeBus.addEventListener('vote_casted', handleVoteCasted);
    realtimeBus.addEventListener('data_reset', handleDataReset);
    realtimeBus.addEventListener('periods_updated', handlePeriodUpdate);

    return () => {
      realtimeBus.removeEventListener('vote_casted', handleVoteCasted);
      realtimeBus.removeEventListener('data_reset', handleDataReset);
      realtimeBus.removeEventListener('periods_updated', handlePeriodUpdate);
    };
  }, [activePeriod]);

  // Cari kandidat terdepan
  const leadingCandidate = [...stats].sort((a, b) => b.votes_count - a.votes_count)[0];

  return (
    <div className="space-y-8 pb-12">
      {/* Dynamic Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white p-6 sm:p-10 shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-semibold tracking-wide uppercase">
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Papan Rekapitulasi Real-Time &bull; LUBER-JURDIL</span>
            </div>

            {activePeriod && (
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase border ${
                  activePeriod.status === 'aktif'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40'
                    : activePeriod.status === 'selesai'
                    ? 'bg-slate-500/20 text-slate-300 border-slate-400/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    activePeriod.status === 'aktif'
                      ? 'bg-emerald-400 animate-pulse'
                      : activePeriod.status === 'selesai'
                      ? 'bg-slate-400'
                      : 'bg-amber-400'
                  }`}
                />
                <span>
                  {activePeriod.status === 'aktif'
                    ? 'Pemungutan Suara Aktif'
                    : activePeriod.status === 'selesai'
                    ? 'Pemilihan Ditutup (Selesai)'
                    : 'Tahap Persiapan (Draft)'}
                </span>
              </div>
            )}
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            {activePeriod?.period_name || 'Pemilihan Ketua OSIS / OSIM'}
          </h2>
          <p className="mt-2 text-sm sm:text-base text-slate-300 font-normal max-w-2xl leading-relaxed">
            Selamat datang di portal pemilihan resmi {school.name}. Gunakan hak suara Anda di bilik suara digital
            menggunakan NISN dan kode PIN rahasia Anda.
          </p>

          {/* Action Row */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={onGoToBilikSuara}
              className={`px-6 py-3 font-bold text-sm rounded-xl shadow-lg transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                activePeriod?.status === 'aktif'
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-emerald-500/25'
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600/50 shadow-slate-900/30'
              }`}
            >
              <Vote className={`w-4 h-4 ${activePeriod?.status === 'aktif' ? 'text-slate-950' : 'text-slate-300'}`} />
              <span>
                {activePeriod?.status === 'aktif'
                  ? 'Masuk ke Bilik Suara Siswa'
                  : activePeriod?.status === 'draft'
                  ? 'Bilik Suara (Tahap Persiapan)'
                  : activePeriod?.status === 'selesai'
                  ? 'Bilik Suara (Pemilihan Selesai)'
                  : 'Bilik Suara Siswa (Belum Ada Periode)'}
              </span>
              {activePeriod?.status === 'aktif' && (
                <span className="w-2 h-2 rounded-full bg-emerald-950 animate-ping"></span>
              )}
            </button>

            <div className="flex items-center gap-2 text-xs text-slate-400 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
              <Clock3 className="w-3.5 h-3.5 text-slate-300" />
              <span>
                Pembaruan Terakhir: {lastUpdated.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Metrik Partisipasi DPT Cards */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Metrik Partisipasi Pemilih
            </h3>
            <p className="text-xs text-slate-500">
              Data akumulasi dari Daftar Pemilih Tetap (DPT) terverifikasi
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total DPT */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total DPT
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
                {metrics.total_dpt}
              </span>
              <span className="text-xs text-slate-400 ml-1.5">Siswa</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Pemilih terdaftar resmi
            </div>
          </div>

          {/* Suara Masuk */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                Suara Masuk
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono">
                {metrics.total_voted}
              </span>
              <span className="text-xs text-emerald-700 ml-1.5 font-medium">Suara</span>
            </div>
            <div className="mt-2 text-[11px] text-emerald-600 font-medium">
              Telah menggunakan hak pilih
            </div>
          </div>

          {/* Belum Memilih */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
                Belum Memilih
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock3 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 font-mono">
                {metrics.total_unvoted}
              </span>
              <span className="text-xs text-amber-700 ml-1.5 font-medium">Siswa</span>
            </div>
            <div className="mt-2 text-[11px] text-amber-600 font-medium">
              Menunggu antrean di bilik
            </div>
          </div>

          {/* Persentase Partisipasi */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-5 rounded-2xl text-white shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-100 uppercase tracking-wider">
                Tingkat Partisipasi
              </span>
              <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono">
                {metrics.participation_rate}%
              </span>
            </div>
            {/* Mini Progress Bar */}
            <div className="mt-2.5 w-full bg-blue-950/40 rounded-full h-2 overflow-hidden">
              <div
                className="bg-emerald-400 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.min(metrics.participation_rate, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Visualisasi Quick Count Real-time */}
      <section className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Perolehan Suara Pasangan Calon (Quick Count)
            </h3>
            <p className="text-xs text-slate-500">
              Perhitungan suara langsung dari bilik suara digital secara real-time
            </p>
          </div>

          {/* Chart Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start">
            <button
              onClick={() => setActiveTab('bar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'bar' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Diagram Batang
            </button>
            <button
              onClick={() => setActiveTab('donut')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'donut' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Diagram Lingkaran
            </button>
          </div>
        </div>

        {activeTab === 'bar' ? (
          /* Diagram Batang Vertikal Dinamis */
          <div className="relative pt-6 pb-2">
            {/* Y-Axis Grid Lines background */}
            <div className="absolute inset-0 top-6 bottom-48 flex flex-col justify-between pointer-events-none text-[11px] font-mono text-slate-400">
              {[100, 75, 50, 25, 0].map((tick) => (
                <div key={tick} className="flex items-center w-full">
                  <span className="w-9 pr-2 text-right shrink-0">{tick}%</span>
                  <div className="flex-1 border-b border-dashed border-slate-200"></div>
                </div>
              ))}
            </div>

            {/* Candidate Vertical Bars Columns - Dynamically matches number of candidates */}
            <div className="relative pl-10 pr-2">
              <div
                className="grid gap-3 sm:gap-6 md:gap-8 items-end"
                style={{
                  gridTemplateColumns: `repeat(${stats.length || 1}, minmax(0, 1fr))`,
                }}
              >
                {stats.map((cand) => {
                  const isLead =
                    leadingCandidate &&
                    leadingCandidate.candidate_id === cand.candidate_id &&
                    cand.votes_count > 0;
                  const candidateDetail = candidates.find(
                    (c) => c.id === cand.candidate_id
                  );

                  return (
                    <div
                      key={cand.candidate_id}
                      className="flex flex-col items-center group"
                    >
                      {/* Value & Status Floating Header */}
                      <div className="mb-2 text-center flex flex-col items-center min-h-[58px] justify-end">
                        {isLead && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-xs mb-1 animate-pulse">
                            <Award className="w-3 h-3 text-amber-600" />
                            Memimpin
                          </span>
                        )}
                        <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-slate-900">
                          {cand.percentage}%
                        </div>
                        <div className="text-[11px] font-bold font-mono text-slate-500">
                          {cand.votes_count} suara
                        </div>
                      </div>

                      {/* Vertical Bar Container Track */}
                      <div className="w-full max-w-[120px] h-64 sm:h-72 bg-slate-100/90 rounded-2xl flex flex-col justify-end p-1.5 border border-slate-200 shadow-inner relative overflow-hidden group-hover:border-slate-300 transition-colors">
                        {/* Subtle vertical glow/highlight */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-200/30 to-transparent pointer-events-none" />

                        {/* The Rising Animated Bar */}
                        <div
                          className="w-full rounded-xl transition-all duration-700 ease-out relative flex flex-col justify-between items-center py-2 shadow-sm"
                          style={{
                            height: `${Math.max(cand.percentage, cand.votes_count > 0 ? 6 : 3)}%`,
                            backgroundColor: cand.color,
                          }}
                        >
                          {/* Bar Cap Accent */}
                          <div className="w-8 h-1 rounded-full bg-white/40 mb-auto" />
                          {cand.percentage >= 15 && (
                            <span className="text-[11px] font-black text-white font-mono drop-shadow-xs">
                              {cand.percentage}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Candidate Identity Card (X-Axis) */}
                      <div className="mt-4 w-full text-center flex flex-col items-center">
                        {/* Ballot Badge */}
                        <div
                          className="inline-flex items-center justify-center px-3 py-1 rounded-xl text-xs font-black text-white shadow-xs mb-2"
                          style={{ backgroundColor: cand.color }}
                        >
                          No. 0{cand.ballot_number}
                        </div>

                        {/* Candidate Avatar / Photo */}
                        {candidateDetail?.photo_url && (
                          <div
                            className="w-12 h-12 rounded-full overflow-hidden border-2 shadow-xs mb-2 bg-slate-100"
                            style={{ borderColor: cand.color }}
                          >
                            <img
                              src={candidateDetail.photo_url}
                              alt={cand.chairman_name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {/* Names */}
                        <h4 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-1 leading-snug">
                          {cand.chairman_name}
                        </h4>
                        <p className="text-[11px] text-slate-500 line-clamp-1">
                          &amp; {cand.vice_chairman_name}
                        </p>
                        {candidateDetail && (
                          <span className="text-[10px] text-slate-400 mt-0.5">
                            {candidateDetail.chairman_class} &bull; {candidateDetail.vice_chairman_class}
                          </span>
                        )}

                        {/* View Vision & Mission button */}
                        {candidateDetail && (
                          <button
                            type="button"
                            onClick={() => setSelectedCandidate(candidateDetail)}
                            className="mt-2 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>Visi &amp; Misi</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Donut / Circular Breakdown */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center py-4">
            {/* SVG Donut */}
            <div className="flex justify-center">
              <div className="relative w-56 h-56 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background Circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#f1f5f9"
                    strokeWidth="16"
                  />
                  {/* Slices calculation */}
                  {(() => {
                    let cumulativeOffset = 0;
                    const circumference = 2 * Math.PI * 40; // ~251.32
                    return stats.map((cand) => {
                      const strokeDash = (cand.percentage / 100) * circumference;
                      const strokeOffset = circumference - strokeDash;
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

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xs uppercase font-semibold tracking-wider text-slate-400">
                    Total Suara
                  </span>
                  <span className="text-3xl font-extrabold font-mono text-slate-900">
                    {metrics.total_voted}
                  </span>
                  <span className="text-[11px] text-emerald-600 font-semibold">
                    Masuk ke Sistem
                  </span>
                </div>
              </div>
            </div>

            {/* Legend & Breakdown */}
            <div className="space-y-3.5">
              {stats.map((cand) => (
                <div
                  key={cand.candidate_id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full shrink-0"
                      style={{ backgroundColor: cand.color }}
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        No. 0{cand.ballot_number}: {cand.chairman_name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        &amp; {cand.vice_chairman_name}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold font-mono text-slate-900 block">
                      {cand.votes_count} suara
                    </span>
                    <span className="text-xs font-semibold text-blue-600">
                      {cand.percentage}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Profil Pasangan Calon (Kandidat Cards) */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              Pasangan Calon Ketua &amp; Wakil Ketua
            </h3>
            <p className="text-xs text-slate-500">
              Kenali calon pemimpin sekolah Anda sebelum menentukan pilihan di bilik suara
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {candidates.map((cand) => {
            const stat = stats.find((s) => s.candidate_id === cand.id);
            return (
              <div
                key={cand.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  {/* Photo & Number Header */}
                  <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
                    <img
                      src={cand.photo_url}
                      alt={cand.chairman_name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                    {/* Ballot Number Badge */}
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs text-slate-900 px-3 py-1 rounded-xl shadow-md font-mono font-extrabold text-sm flex items-center gap-1.5 border border-slate-200">
                      <span className="text-slate-400 text-xs">NO.</span>
                      <span className="text-blue-600 text-base">0{cand.ballot_number}</span>
                    </div>

                    {/* Candidate names over image */}
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h4 className="font-bold text-base leading-tight drop-shadow-xs">
                        {cand.chairman_name}
                      </h4>
                      <p className="text-xs text-slate-200 font-medium drop-shadow-xs">
                        &amp; {cand.vice_chairman_name}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-blue-200">
                        <span>Kelas {cand.chairman_class}</span>
                        <span>&bull;</span>
                        <span>Kelas {cand.vice_chairman_class}</span>
                      </div>
                    </div>
                  </div>

                  {/* Vision snippet */}
                  <div className="p-5 space-y-3.5">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Visi Utama
                      </span>
                      <p className="text-xs text-slate-700 italic font-medium mt-1 line-clamp-3 leading-relaxed">
                        &ldquo;{cand.vision}&rdquo;
                      </p>
                    </div>

                    {/* Work programs preview */}
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Program Unggulan
                      </span>
                      <ul className="mt-1 space-y-1">
                        {cand.programs.slice(0, 2).map((prog, i) => (
                          <li
                            key={i}
                            className="text-xs text-slate-600 flex items-start gap-2 truncate"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="truncate">{prog}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Perolehan Suara Badge */}
                    {stat && (
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Perolehan Sementara:</span>
                        <span className="font-bold font-mono text-slate-900">
                          {stat.votes_count} suara ({stat.percentage}%)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-5 pt-0">
                  <button
                    onClick={() => setSelectedCandidate(cand)}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Lihat Visi, Misi &amp; Video</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Keamanan & Transparansi Notice */}
      <section className="bg-blue-50 border border-blue-200 rounded-2xl p-5 text-blue-900 flex flex-col sm:flex-row items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
          <Shield className="w-6 h-6" />
        </div>
        <div className="text-center sm:text-left">
          <h4 className="font-bold text-sm">
            Prinsip Pemilihan LUBER-JURDIL Terjamin
          </h4>
          <p className="text-xs text-blue-800/90 mt-0.5">
            Sistem memisahkan data identitas pemilih dari tabel suara yang tersimpan. Suara Anda tidak dapat
            dilacak kembali kepada identitas pribadi Anda untuk menjamin kerahasiaan 100%.
          </p>
        </div>
      </section>

      {/* Candidate Modal */}
      <CandidateDetailModal
        candidate={selectedCandidate}
        onClose={() => setSelectedCandidate(null)}
      />
    </div>
  );
};
