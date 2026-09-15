import React, { useState } from 'react';
import { School, ElectionPeriod, Candidate, QuickCountStat, ElectionMetrics, Committee } from '../../types';
import { Printer, ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react';
import { db } from '../../lib/storage';
import { AppLogo } from '../common/AppLogo';

interface PrintableBAHPProps {
  school: School;
  activePeriod: ElectionPeriod | null;
  candidates: Candidate[];
  stats: QuickCountStat[];
  metrics: ElectionMetrics;
  committees: Committee[];
  onBack: () => void;
}

export const PrintableBAHP: React.FC<PrintableBAHPProps> = ({
  school,
  activePeriod,
  stats,
  metrics,
  committees,
  onBack,
}) => {
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(0.15); // 15% default jernih & elegan

  const handlePrint = () => {
    window.print();
  };

  // Pemenang suara terbanyak
  const winner = [...stats].sort((a, b) => b.votes_count - a.votes_count)[0];
  const ketuaPanitia = committees.find((c) => c.role === 'Ketua Panitia');
  const sekretarisPanitia = committees.find((c) => c.role === 'Sekretaris');

  const todayStr = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const isOsim = school.type === 'OSIM';
  const orgName = isOsim ? 'ORGANISASI SANTRI INTRA MADRASAH (OSIM)' : 'ORGANISASI SISWA INTRA SEKOLAH (OSIS)';

  return (
    <div className="bg-slate-100 min-h-screen p-4 sm:p-8 print:p-0 print:bg-white text-slate-900">
      {/* Control Bar (Hidden on Print) */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Panel Admin</span>
        </button>

        {/* Pengatur Kepekatan Watermark Monokrom */}
        <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span className="text-slate-600 font-semibold text-[11px]">Watermark:</span>
          {[
            { label: 'Lembut (8%)', val: 0.08 },
            { label: 'Jelas (15%)', val: 0.15 },
            { label: 'Tegas (22%)', val: 0.22 },
            { label: 'Off', val: 0 },
          ].map((opt) => (
            <button
              key={opt.label}
              onClick={() => setWatermarkOpacity(opt.val)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
                watermarkOpacity === opt.val
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Simpan PDF Berita Acara</span>
          </button>
        </div>
      </div>

      {/* Official Document Sheet */}
      <div className="max-w-4xl mx-auto bg-white p-8 sm:p-14 rounded-2xl shadow-xl print:shadow-none print:p-0 border border-slate-200 print:border-none relative overflow-hidden">
        {/* Konten Dokumen Resmi */}
        <div className="relative z-10">
          {/* Kop Surat Institusi Resmi */}
        <div className="border-b-4 border-double border-slate-900 pb-4 mb-6">
          <div className="flex items-center justify-between gap-4">
            {/* Logo Pemda (Kiri) */}
            <div className="w-20 h-20 shrink-0 flex items-center justify-center">
              {school.pemda_logo_url ? (
                <img
                  src={school.pemda_logo_url}
                  alt="Logo Pemda"
                  referrerPolicy="no-referrer"
                  className="max-h-20 max-w-20 object-contain"
                />
              ) : (
                <div className="w-16 h-16 rounded-full border border-dashed border-slate-300 print:hidden flex items-center justify-center text-[10px] text-slate-400 text-center font-medium">
                  Logo Pemda
                </div>
              )}
            </div>

            {/* Teks Identitas Lembaga (Tengah) */}
            <div className="flex-1 text-center">
              <div className="text-xs uppercase font-bold tracking-widest text-slate-700">
                {isOsim ? 'KEMENTERIAN AGAMA REPUBLIK INDONESIA' : 'PEMERINTAH DAERAH / DINAS PENDIDIKAN'}
              </div>
              <h1 className="text-xl sm:text-2xl font-black uppercase text-slate-900 tracking-wide mt-0.5">
                {school.name}
              </h1>
              <p className="text-xs text-slate-700 mt-0.5 font-medium">
                {school.address} &bull; NPSN: {school.npsn}
              </p>
              <p className="text-[11px] text-slate-600 font-semibold mt-0.5">
                PANITIA PEMILIHAN {orgName} TAHUN AJARAN {activePeriod?.academic_year || '2026/2027'}
              </p>
            </div>

            {/* Logo Sekolah / Penyelenggara (Kanan) */}
            <div className="w-20 h-20 shrink-0 flex items-center justify-center">
              {school.logo_url ? (
                <img
                  src={school.logo_url}
                  alt="Logo Sekolah"
                  referrerPolicy="no-referrer"
                  className="max-h-20 max-w-20 object-contain"
                />
              ) : (
                <img
                  src="/logo-epilektos.png"
                  alt="Logo E-PILEKTOS DIGITAL"
                  className="max-h-20 max-w-20 object-contain filter grayscale contrast-125"
                  title="Logo Resmi E-PILEKTOS DIGITAL"
                />
              )}
            </div>
          </div>
        </div>

        {/* LEMBAR UTAMA BERITA ACARA (DILENGKAPI WATERMARK TENGAH) */}
        <div className="relative">
          {/* WATERMARK RESMI E-PILEKTOS (Tepat di tengah lembar berita acara) */}
          {watermarkOpacity > 0 && (
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden"
              aria-hidden="true"
              style={{ opacity: watermarkOpacity }}
            >
              <div className="w-[420px] h-[420px] flex items-center justify-center transform -rotate-12">
                <AppLogo variant="watermark" size={420} className="w-full h-full" />
              </div>
            </div>
          )}

          <div className="relative z-10">

        {/* Document Header */}
        <div className="text-center my-6">
          <h2 className="text-base sm:text-lg font-black underline tracking-wide uppercase">
            BERITA ACARA HASIL PEMILIHAN KETUA DAN WAKIL KETUA {isOsim ? 'OSIM' : 'OSIS'}
          </h2>
          <p className="text-xs font-mono font-bold text-slate-700 mt-1">
            Nomor: 421.3/BAHP-PILKETOS/{new Date().getFullYear()}/IX
          </p>
        </div>

        {/* Pembuka Dokumen */}
        <div className="text-xs sm:text-sm text-slate-800 leading-relaxed text-justify space-y-3 mb-6">
          <p>
            Pada hari ini, tanggal <strong>{todayStr}</strong>, bertempat di Kampus{' '}
            <strong>{school.name}</strong>, telah dilaksanakan pemungutan dan penghitungan suara
            secara elektronik (<em>E-Voting Bilik Suara Digital</em>) dalam rangka{' '}
            <strong>{activePeriod?.period_name || 'Pemilihan Ketua OSIS'}</strong> Masa Bakti Tahun Ajaran{' '}
            <strong>{activePeriod?.academic_year || '2026/2027'}</strong> dengan asas Langsung, Umum, Bebas, Rahasia,
            Jujur, dan Adil (LUBER-JURDIL).
          </p>
          <p>
            Pelaksanaan kegiatan pemilihan ini berlandaskan pada Surat Keputusan Kepala Sekolah Nomor:{' '}
            <strong>
              {ketuaPanitia?.sk_number ||
                committees[0]?.sk_number ||
                db.getSKConfig(activePeriod?.id).sk_number}
            </strong>{' '}
            tentang Pembentukan Panitia Pelaksana Pemilihan.
          </p>
        </div>

        {/* Bagian I: Rekapitulasi Partisipasi Pemilih */}
        <div className="mb-6">
          <h3 className="text-xs sm:text-sm font-bold uppercase text-slate-900 border-b border-slate-300 pb-1 mb-2">
            I. REKAPITULASI PARTISIPASI DAFTAR PEMILIH TETAP (DPT)
          </h3>
          <table className="w-full text-xs border border-slate-300">
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="p-2 font-medium bg-slate-50 w-2/3">1. Jumlah Pemilih Terdaftar dalam DPT</td>
                <td className="p-2 font-bold font-mono text-right">{metrics.total_dpt} Pemilih</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="p-2 font-medium bg-slate-50">2. Jumlah Pemilih yang Menggunakan Hak Suara (Suara Sah)</td>
                <td className="p-2 font-bold font-mono text-right text-emerald-800">{metrics.total_voted} Suara</td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="p-2 font-medium bg-slate-50">3. Jumlah Pemilih yang Tidak Hadir / Belum Memilih</td>
                <td className="p-2 font-bold font-mono text-right">{metrics.total_unvoted} Pemilih</td>
              </tr>
              <tr className="bg-slate-100 font-bold">
                <td className="p-2">Persentase Tingkat Partisipasi Pemilih (Turnout)</td>
                <td className="p-2 text-right font-mono text-blue-800">{metrics.participation_rate}%</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bagian II: Rekapitulasi Perolehan Suara */}
        <div className="mb-6">
          <h3 className="text-xs sm:text-sm font-bold uppercase text-slate-900 border-b border-slate-300 pb-1 mb-2">
            II. PEROLEHAN SUARA PASANGAN CALON
          </h3>
          <table className="w-full text-xs border border-slate-300 text-left">
            <thead className="bg-slate-100 border-b border-slate-300 font-bold uppercase">
              <tr>
                <th className="p-2 text-center w-12">No</th>
                <th className="p-2">Nama Pasangan Calon</th>
                <th className="p-2 text-right">Jumlah Suara</th>
                <th className="p-2 text-right">Persentase</th>
                <th className="p-2 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {stats.map((cand) => {
                const isElected = winner && cand.candidate_id === winner.candidate_id && cand.votes_count > 0;
                return (
                  <tr key={cand.candidate_id} className={isElected ? 'bg-blue-50/50 font-semibold' : ''}>
                    <td className="p-2 text-center font-mono font-bold">0{cand.ballot_number}</td>
                    <td className="p-2">
                      <div className="font-bold text-slate-900">{cand.chairman_name}</div>
                      <div className="text-[11px] text-slate-600">&amp; {cand.vice_chairman_name}</div>
                    </td>
                    <td className="p-2 text-right font-mono font-bold">{cand.votes_count} suara</td>
                    <td className="p-2 text-right font-mono font-bold">{cand.percentage}%</td>
                    <td className="p-2 text-center">
                      {isElected ? (
                        <span className="px-2 py-0.5 rounded-sm bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          TERPILIH
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bagian III: Penetapan Pemenang */}
        {winner && winner.votes_count > 0 && (
          <div className="mb-8 p-4 rounded-xl border border-blue-200 bg-blue-50/60 text-xs sm:text-sm text-slate-800">
            <h3 className="font-bold text-blue-950 uppercase mb-1">
              III. PENETAPAN PASANGAN CALON TERPILIH
            </h3>
            <p>
              Berdasarkan hasil rekapitulasi perolehan suara sah di atas, Panitia Pemilihan menetapkan:
            </p>
            <div className="mt-2 font-bold text-slate-900">
              Pasangan Calon Nomor Urut 0{winner.ballot_number}: {winner.chairman_name} &amp; {winner.vice_chairman_name}
            </div>
            <p className="mt-1 text-slate-700">
              Sebagai <strong>Ketua dan Wakil Ketua {isOsim ? 'OSIM' : 'OSIS'} Terpilih</strong> Periode{' '}
              {activePeriod?.academic_year || '2026/2027'} dengan perolehan sebanyak{' '}
              <strong>{winner.votes_count} suara ({winner.percentage}%)</strong>.
            </p>
          </div>
        )}

        {/* Penutup Dokumen & Tanda Tangan */}
        <div className="text-xs sm:text-sm text-slate-800 leading-relaxed mb-10 text-justify">
          Demikian Berita Acara Hasil Pemilihan ini dibuat dengan sebenarnya dalam rangkap 3 (tiga) untuk dipergunakan
          sebagaimana mestinya sebagai dasar penerbitan Surat Keputusan Pelantikan Pengurus oleh Kepala Sekolah.
        </div>

        {/* Kolom Tanda Tangan Formal */}
        <div className="grid grid-cols-2 gap-8 text-center text-xs break-inside-avoid">
          <div>
            <p className="text-slate-600">Mengetahui,</p>
            <p className="font-bold text-slate-900 mt-0.5">Ketua Panitia Pemilihan,</p>

            {/* Stempel Digital Panitia */}
            <div className="h-20 flex items-center justify-center my-2">
              <div className="w-20 h-20 rounded-full border-2 border-indigo-500 text-indigo-700 flex flex-col items-center justify-center p-1 opacity-80 rotate-[-5deg]">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <span className="text-[7px] font-black uppercase">TERVERIFIKASI</span>
                <span className="text-[6px] font-mono">DIGITAL SIGN</span>
              </div>
            </div>

            <p className="font-bold underline text-slate-900">
              {ketuaPanitia?.member_name || 'Aditya Surya Wibowo'}
            </p>
            <p className="text-slate-500">Ketua Panitia / MPK</p>
          </div>

          <div>
            <p className="text-slate-600">Ditetapkan dan Disahkan di Jakarta,</p>
            <p className="font-bold text-slate-900 mt-0.5">Kepala {school.name},</p>

            {/* Stempel Digital Kepala Sekolah */}
            <div className="h-20 flex items-center justify-center my-2">
              <div className="w-20 h-20 rounded-full border-2 border-blue-600 text-blue-800 flex flex-col items-center justify-center p-1 opacity-85 rotate-[6deg]">
                <ShieldCheck className="w-5 h-5 text-blue-700" />
                <span className="text-[7px] font-black uppercase">KEPALA SEKOLAH</span>
                <span className="text-[6px] font-mono">SAH RESMI</span>
              </div>
            </div>

            <p className="font-bold underline text-slate-900">{school.principal_name}</p>
            <p className="text-slate-500 font-mono">NIP. {school.principal_nip}</p>
          </div>
        </div>
        </div>
        </div>
        </div>
      </div>
    </div>
  );
};
