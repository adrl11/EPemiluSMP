import React, { useState } from 'react';
import { School, ElectionPeriod, Committee, CommitteeSKConfig } from '../../types';
import { Printer, ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react';
import { AppLogo } from '../common/AppLogo';

interface PrintableSKProps {
  school: School;
  activePeriod: ElectionPeriod | null;
  committees: Committee[];
  skConfig: CommitteeSKConfig;
  onBack: () => void;
}

export const PrintableSK: React.FC<PrintableSKProps> = ({
  school,
  activePeriod,
  committees,
  skConfig,
  onBack,
}) => {
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(0.15); // 15% default jernih & elegan

  const handlePrint = () => {
    window.print();
  };

  const ketuaPanitia = committees.find((c) => c.role === 'Ketua Panitia');

  let formattedDate = skConfig.sk_date;
  try {
    const d = new Date(skConfig.sk_date);
    if (!isNaN(d.getTime())) {
      formattedDate = d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    }
  } catch {
    formattedDate = skConfig.sk_date;
  }

  const isOsim = school.type === 'OSIM';
  const orgName = isOsim ? 'ORGANISASI SANTRI INTRA MADRASAH (OSIM)' : 'ORGANISASI SISWA INTRA SEKOLAH (OSIS)';
  const orgShort = isOsim ? 'OSIM' : 'OSIS';
  const schoolType = isOsim ? 'Madrasah' : 'Sekolah';
  const schoolTypeUpper = isOsim ? 'MADRASAH' : 'SEKOLAH';
  const academicYear = activePeriod?.academic_year || '2026/2027';
  const locationCity = school.address ? school.address.split(',').pop()?.trim() || 'Tempat' : 'Tempat';

  return (
    <div className="bg-slate-100 min-h-screen p-4 sm:p-8 print:p-0 print:bg-white text-slate-900">
      {/* Control Bar (Hidden on Print) */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer self-start sm:self-auto"
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

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Simpan PDF SK</span>
          </button>
        </div>
      </div>

      {/* Official Document Sheet */}
      <div className="max-w-4xl mx-auto bg-white p-8 sm:p-14 rounded-2xl shadow-xl print:shadow-none print:p-0 border border-slate-200 print:border-none relative overflow-hidden">
        {/* Konten Dokumen SK */}
        <div className="relative z-10">
          {/* Kop Surat Institusi Resmi (Sesuai Gaya BAHP) */}
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
                {school.agency_name || (isOsim ? 'KEMENTERIAN AGAMA REPUBLIK INDONESIA' : 'PEMERINTAH DAERAH / DINAS PENDIDIKAN')}
              </div>
              <h1 className="text-xl sm:text-2xl font-black uppercase text-slate-900 tracking-wide mt-0.5">
                {school.name}
              </h1>
              <p className="text-xs text-slate-700 mt-0.5 font-medium">
                {school.address} &bull; NPSN: {school.npsn}
              </p>
              <p className="text-[11px] text-slate-600 font-semibold mt-0.5">
                PEMILIHAN {orgName} TAHUN AJARAN {academicYear}
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
                  alt="Logo E-PILKETOS DIGITAL"
                  className="max-h-20 max-w-20 object-contain filter grayscale contrast-125"
                  title="Logo Resmi E-PILKETOS DIGITAL"
                />
              )}
            </div>
          </div>
        </div>

        {/* SECTION 1: LEMBAR KEPUTUSAN UTAMA (DILENGKAPI WATERMARK RESMI TENGAH) */}
        <div className="relative">
          {/* WATERMARK RESMI LEMBAR 1 (Tepat di tengah area teks keputusan) */}
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

        {/* Judul Surat Keputusan */}
        <div className="text-center my-6">
          <h2 className="text-base sm:text-lg font-black underline tracking-wide uppercase">
            SURAT KEPUTUSAN KEPALA {schoolTypeUpper}
          </h2>
          <p className="text-xs font-mono font-bold text-slate-800 mt-1">
            Nomor: {skConfig.sk_number}
          </p>
          <div className="mt-3 text-xs sm:text-sm font-bold uppercase tracking-wide leading-relaxed text-slate-900">
            TENTANG<br />
            PENETAPAN DAN PENGANGKATAN PANITIA PELAKSANA PEMILIHAN<br />
            KETUA DAN WAKIL KETUA {orgShort}<br />
            MASA BAKTI TAHUN AJARAN {academicYear}
          </div>
        </div>

        {/* Konsideran */}
        <div className="text-xs sm:text-sm text-slate-800 leading-relaxed text-justify space-y-4 mb-6">
          <div className="text-center font-bold">
            DENGAN RAHMAT TUHAN YANG MAHA ESA<br />
            KEPALA {school.name.toUpperCase()}
          </div>

          <table className="w-full text-xs sm:text-sm border-collapse">
            <tbody>
              <tr className="align-top">
                <td className="w-28 font-bold pr-2 py-1">Menimbang</td>
                <td className="w-4 py-1">:</td>
                <td className="py-1">
                  <ol className="list-[lower-alpha] pl-5 space-y-1">
                    <li>
                      Bahwa dalam rangka menjamin kelancaran, ketertiban, dan kesinambungan roda organisasi kesiswaan, perlu diselenggarakan pemilihan kepengurusan {orgShort};
                    </li>
                    <li>
                      Bahwa untuk melaksanakan proses pemilihan secara demokratis, langsung, umum, bebas, rahasia, jujur, dan adil (LUBER-JURDIL) berbasis digital, dipandang perlu mengangkat Panitia Pelaksana Pemilihan;
                    </li>
                    <li>
                      Bahwa nama-nama yang tercantum dalam lampiran keputusan ini dipandang mampu, berintegritas, dan memenuhi syarat untuk melaksanakan amanah tersebut.
                    </li>
                  </ol>
                </td>
              </tr>
              <tr className="align-top">
                <td className="font-bold pr-2 py-2">Mengingat</td>
                <td className="py-2">:</td>
                <td className="py-2">
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>Undang-Undang Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional;</li>
                    <li>Peraturan Menteri Pendidikan Nasional Nomor 39 Tahun 2008 tentang Pembinaan Kesiswaan;</li>
                    <li>Anggaran Dasar dan Anggaran Rumah Tangga (AD/ART) {orgShort};</li>
                    <li>Program Kerja Kesiswaan {school.name} Tahun Ajaran {academicYear}.</li>
                  </ol>
                </td>
              </tr>
            </tbody>
          </table>

          <div className="text-center font-black tracking-wider pt-2 pb-1 border-t border-slate-200 uppercase">
            MEMUTUSKAN:
          </div>

          <table className="w-full text-xs sm:text-sm border-collapse">
            <tbody>
              <tr className="align-top">
                <td className="w-28 font-bold pr-2 py-1.5">Menetapkan</td>
                <td className="w-4 py-1.5">:</td>
                <td className="py-1.5"></td>
              </tr>
              <tr className="align-top">
                <td className="font-bold pr-2 py-1 pl-4">PERTAMA</td>
                <td className="py-1">:</td>
                <td className="py-1">
                  Mengangkat dan menetapkan Panitia Pelaksana Pemilihan Ketua dan Wakil Ketua {orgShort} Masa Bakti {academicYear} dengan susunan personalia sebagaimana tercantum dalam Lampiran Keputusan ini.
                </td>
              </tr>
              <tr className="align-top">
                <td className="font-bold pr-2 py-1 pl-4">KEDUA</td>
                <td className="py-1">:</td>
                <td className="py-1">
                  Panitia sebagaimana dimaksud bertugas menyusun tata tertib pemilihan, memvalidasi Daftar Pemilih Tetap (DPT), mengelola token PIN pemilihan, mengawasi bilik suara digital, hingga menandatangani Berita Acara Hasil Pemilihan (BAHP).
                </td>
              </tr>
              <tr className="align-top">
                <td className="font-bold pr-2 py-1 pl-4">KETIGA</td>
                <td className="py-1">:</td>
                <td className="py-1">
                  Segala biaya yang timbul sebagai akibat pelaksanaan keputusan ini dibebankan pada anggaran kegiatan pembinaan kesiswaan yang sah.
                </td>
              </tr>
              <tr className="align-top">
                <td className="font-bold pr-2 py-1 pl-4">KEEMPAT</td>
                <td className="py-1">:</td>
                <td className="py-1">
                  Keputusan ini mulai berlaku sejak tanggal ditetapkan, dan apabila di kemudian hari terdapat kekeliruan akan diadakan perbaikan sebagaimana mestinya.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Lembar Pengesahan SK */}
        <div className="mt-8 pt-4 flex justify-end">
          <div className="text-xs sm:text-sm text-left w-72">
            <p>Ditetapkan di: {locationCity}</p>
            <p>Pada tanggal: {formattedDate}</p>
            <p className="font-bold mt-2">Kepala {schoolType},</p>
            <div className="h-20 flex items-center">
              <span className="text-[10px] text-slate-400 italic print:hidden">
                [Tanda Tangan &amp; Cap Stempel Resmi]
              </span>
            </div>
            <p className="font-bold underline text-slate-900">{school.principal_name}</p>
            <p className="text-slate-600 font-mono text-xs">NIP. {school.principal_nip}</p>
          </div>
        </div>

        </div>
        </div>

        {/* SECTION 2: LAMPIRAN SUSUNAN PANITIA (Format Resmi Sesuai BAHP - Dilengkapi Watermark Lembar 2) */}
        <div className="relative mt-12 pt-8 border-t-2 border-dashed border-slate-300 print:break-before-page print:border-none print:pt-4">
          {/* WATERMARK RESMI LEMBAR 2 (Tepat di tengah tabel lampiran panitia) */}
          {watermarkOpacity > 0 && (
            <div
              className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden"
              aria-hidden="true"
              style={{ opacity: watermarkOpacity }}
            >
              <div className="w-[380px] h-[380px] flex items-center justify-center transform -rotate-12">
                <AppLogo variant="watermark" size={380} className="w-full h-full" />
              </div>
            </div>
          )}

          <div className="relative z-10">
            <div className="mb-4 text-xs font-mono text-slate-700">
              <p><strong>LAMPIRAN SURAT KEPUTUSAN KEPALA {schoolTypeUpper}</strong></p>
              <p>Nomor: {skConfig.sk_number}</p>
              <p>Tanggal: {formattedDate}</p>
              <p>Tentang: Susunan Panitia Pelaksana Pemilihan {orgShort} Masa Bakti {academicYear}</p>
            </div>

          <h3 className="text-xs sm:text-sm font-bold uppercase text-slate-900 border-b border-slate-300 pb-1 mb-3 text-center">
            SUSUNAN PERSONALIA PANITIA PELAKSANA PEMILIHAN
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse border border-slate-300">
              <thead className="bg-slate-100 font-bold uppercase text-slate-800">
                <tr>
                  <th className="border border-slate-300 px-3 py-2 w-10 text-center">No</th>
                  <th className="border border-slate-300 px-3 py-2">Nama Lengkap Anggota</th>
                  <th className="border border-slate-300 px-3 py-2">Jabatan Kepanitiaan</th>
                  <th className="border border-slate-300 px-3 py-2 font-mono">Email / Akun</th>
                  <th className="border border-slate-300 px-3 py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {committees.length > 0 ? (
                  committees.map((comm, idx) => (
                    <tr key={comm.id}>
                      <td className="border border-slate-300 px-3 py-2 text-center font-mono">{idx + 1}</td>
                      <td className="border border-slate-300 px-3 py-2 font-bold">{comm.member_name}</td>
                      <td className="border border-slate-300 px-3 py-2">{comm.role}</td>
                      <td className="border border-slate-300 px-3 py-2 font-mono text-[11px] text-slate-600">{comm.email}</td>
                      <td className="border border-slate-300 px-3 py-2 text-center font-bold text-[11px] uppercase">
                        {comm.status}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="border border-slate-300 px-3 py-6 text-center text-slate-400 italic">
                      Belum ada anggota panitia yang didaftarkan pada periode ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Tanda Tangan Lampiran */}
          <div className="mt-8 flex justify-between gap-4 text-xs sm:text-sm">
            <div className="text-left w-64">
              <p className="font-bold">Mengetahui,</p>
              <p>Ketua Panitia Pemilihan,</p>
              <div className="h-16 flex items-center">
                <span className="text-[10px] text-slate-400 italic print:hidden">
                  [Tanda Tangan]
                </span>
              </div>
              <p className="font-bold underline text-slate-900">
                {ketuaPanitia?.member_name || '( .............................................. )'}
              </p>
              <p className="text-slate-600 font-mono text-[11px]">
                {ketuaPanitia?.email || 'NIM / NISN Panitia'}
              </p>
            </div>

            <div className="text-left w-64">
              <p>Ditetapkan di: {locationCity}</p>
              <p className="font-bold">Kepala {schoolType},</p>
              <div className="h-16 flex items-center">
                <span className="text-[10px] text-slate-400 italic print:hidden">
                  [Tanda Tangan &amp; Cap Stempel]
                </span>
              </div>
              <p className="font-bold underline text-slate-900">{school.principal_name}</p>
              <p className="text-slate-600 font-mono text-[11px]">NIP. {school.principal_nip}</p>
            </div>
          </div>
        </div>
        </div>

        {/* Security Stamp Footer (Sesuai Gaya BAHP) */}
        <div className="mt-12 pt-4 border-t border-slate-300 flex items-center justify-between text-[11px] text-slate-600">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Dokumen Keputusan Resmi Sah &bull; Sistem E-Pilketos &amp; E-Pilkosim Digital</span>
          </div>
          <span className="font-mono">ID Validasi: SK-{skConfig.sk_date.replace(/-/g, '')}-{school.npsn}</span>
        </div>
        </div>
      </div>
    </div>
  );
};
