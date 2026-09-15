import { Voter, School, ElectionPeriod, Committee, CommitteeSKConfig } from '../types';

/**
 * Ekspor DPT ke format CSV
 */
export function exportDptToCsv(voters: Voter[], periodName: string): void {
  const headers = ['No', 'NISN', 'Nama Lengkap', 'Kelas', 'Jenis Kelamin', 'Token PIN', 'Status Memilih', 'Waktu Memilih'];
  const rows = voters.map((v, i) => [
    i + 1,
    `"${v.nisn}"`,
    `"${v.full_name}"`,
    `"${v.class_name}"`,
    v.gender,
    `"${v.pin_plain}"`,
    v.has_voted ? 'SUDAH' : 'BELUM',
    v.voted_at ? `"${new Date(v.voted_at).toLocaleString('id-ID')}"` : '-',
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `DPT_${periodName.replace(/\s+/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Unduh Template CSV untuk impor data DPT (Mendukung SMP/MTs & SMA/SMK/MA)
 */
export function downloadDptTemplate(educationLevel: 'SMP' | 'SMA' = 'SMA'): void {
  const isSmp = educationLevel === 'SMP';
  const template = isSmp
    ? `NISN,Nama Lengkap,Kelas,Jenis Kelamin
0099876501,Ahmad Fauzan Pratama,VII-A,L
0099876502,Aisyah Putri Rahmadani,7B,P
0088765401,Budi Santoso,VIII-1,L
0077654301,Nadia Nur Aini,IX Unggulan,P`
    : `NISN,Nama Lengkap,Kelas,Jenis Kelamin
0069876501,Arya Bagus Pratama,X-A,L
0069876502,Dewi Sartika Putri,X-A,P
0058765401,Muhammad Zaki Raihan,XI MIPA 1,L
0047654301,Siti Nurhaliza,XII IPS 2,P`;

  const blob = new Blob(['\uFEFF' + template], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', isSmp ? 'Template_Import_DPT_SMP_MTs.csv' : 'Template_Import_DPT_SMA_SMK.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Parsing teks CSV menjadi data voter mentah
 */
export function parseDptCsv(csvText: string): Array<{
  nisn: string;
  full_name: string;
  class_name: string;
  gender: 'L' | 'P';
}> {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  // Lewati header baris 1
  const results: Array<{
    nisn: string;
    full_name: string;
    class_name: string;
    gender: 'L' | 'P';
  }> = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    // Handle parsing sederhana dengan split koma atau titik koma
    const parts = line.includes(';') ? line.split(';') : line.split(',');
    if (parts.length >= 3) {
      const nisn = parts[0].replace(/["']/g, '').trim();
      const full_name = parts[1].replace(/["']/g, '').trim();
      const class_name = parts[2].replace(/["']/g, '').trim();
      const rawGender = parts[3] ? parts[3].replace(/["']/g, '').trim().toUpperCase() : 'L';
      const gender: 'L' | 'P' = rawGender === 'P' || rawGender === 'PEREMPUAN' ? 'P' : 'L';

      if (nisn && full_name) {
        results.push({ nisn, full_name, class_name, gender });
      }
    }
  }

  return results;
}

/**
 * Mengunduh dokumen Surat Keputusan (SK) Kepanitiaan resmi
 * Jika ada file kustom yang diunggah (PDF/DOC), file tersebut akan diunduh langsung.
 * Jika tidak ada file kustom, sistem akan secara otomatis membuat dan mengunduh berkas SK resmi berformat siap cetak / PDF.
 */
export function downloadSKDocument(
  school: School,
  period: ElectionPeriod | null,
  committees: Committee[],
  skConfig: CommitteeSKConfig
): void {
  // 1. Jika ada file berkas yang diunggah pengguna (base64 Data URL)
  if (skConfig.sk_file_data && skConfig.sk_file_data.startsWith('data:')) {
    const link = document.createElement('a');
    link.href = skConfig.sk_file_data;
    link.download = skConfig.sk_file_name || `SK_Kepanitiaan_${skConfig.sk_number.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // 2. Format tanggal Indonesia
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
  const orgName = isOsim ? 'OSIM (Organisasi Santri Intra Madrasah)' : 'OSIS (Organisasi Siswa Intra Sekolah)';
  const orgTypeUpper = isOsim ? 'ORGANISASI SANTRI INTRA MADRASAH (OSIM)' : 'ORGANISASI SISWA INTRA SEKOLAH (OSIS)';
  const schoolType = isOsim ? 'Madrasah' : 'Sekolah';
  const schoolTypeUpper = isOsim ? 'MADRASAH' : 'SEKOLAH';
  const periodName = period?.period_name || `Pemilihan Ketua dan Wakil Ketua ${isOsim ? 'OSIM' : 'OSIS'}`;
  const academicYear = period?.academic_year || '2026/2027';

  // Susun tabel anggota panitia
  const committeeRows = committees.length > 0
    ? committees.map((c, i) => `
      <tr>
        <td style="border: 1px solid #333; padding: 6px 10px; text-align: center;">${i + 1}</td>
        <td style="border: 1px solid #333; padding: 6px 10px; font-weight: bold;">${c.member_name}</td>
        <td style="border: 1px solid #333; padding: 6px 10px;">${c.role}</td>
        <td style="border: 1px solid #333; padding: 6px 10px; font-family: monospace; font-size: 11px;">${c.email}</td>
        <td style="border: 1px solid #333; padding: 6px 10px; text-align: center; text-transform: uppercase;">${c.status}</td>
      </tr>
    `).join('')
    : `
      <tr>
        <td colspan="5" style="border: 1px solid #333; padding: 12px; text-align: center; color: #666; font-style: italic;">
          Belum ada data anggota panitia terdaftar.
        </td>
      </tr>
    `;

  // HTML Dokumen SK Lengkap Siap Cetak
  const htmlDoc = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Surat Keputusan Kepanitiaan - ${skConfig.sk_number}</title>
  <style>
    @page {
      size: A4;
      margin: 20mm 20mm 20mm 20mm;
    }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 12pt;
      line-height: 1.45;
      color: #000;
      background: #f8fafc;
      margin: 0;
      padding: 24px;
    }
    .document-page {
      background: #fff;
      max-width: 210mm;
      margin: 0 auto;
      padding: 25mm 20mm;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      box-sizing: border-box;
      position: relative;
      overflow: hidden;
    }
    .watermark-overlay {
      position: absolute;
      top: 48%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-12deg);
      width: 420px;
      height: 420px;
      opacity: 0.14;
      pointer-events: none;
      user-select: none;
      z-index: 0;
    }
    .watermark-overlay svg {
      width: 100%;
      height: 100%;
    }
    .doc-inner-content {
      position: relative;
      z-index: 1;
    }
    .no-print-toolbar {
      position: sticky;
      top: 10px;
      max-width: 210mm;
      margin: 0 auto 16px auto;
      background: #1e293b;
      color: #fff;
      padding: 12px 20px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 13px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 999;
    }
    .btn-print {
      background: #2563eb;
      color: #fff;
      border: none;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      font-size: 13px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-print:hover {
      background: #1d4ed8;
    }
    .kop-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      border-bottom: 3px double #000;
      padding-bottom: 12px;
      margin-bottom: 20px;
      text-align: center;
    }
    .kop-logo {
      width: 75px;
      height: 75px;
      object-fit: contain;
    }
    .kop-text {
      flex: 1;
    }
    .kop-text h2 {
      margin: 0;
      font-size: 15pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .kop-text h3 {
      margin: 2px 0;
      font-size: 17pt;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .kop-text p {
      margin: 2px 0;
      font-size: 9.5pt;
    }
    .sk-title {
      text-align: center;
      margin: 20px 0 16px 0;
    }
    .sk-title h4 {
      margin: 0;
      font-size: 13pt;
      text-transform: uppercase;
      text-decoration: underline;
      letter-spacing: 0.5px;
    }
    .sk-title p {
      margin: 4px 0 0 0;
      font-size: 11pt;
      font-weight: bold;
    }
    .about-box {
      text-align: center;
      margin: 12px 0 20px 0;
      font-weight: bold;
      text-transform: uppercase;
      font-size: 11pt;
      line-height: 1.35;
    }
    .content-table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      font-size: 11.5pt;
      line-height: 1.4;
    }
    .content-table td {
      vertical-align: top;
      padding: 3px 0;
    }
    .sign-section {
      margin-top: 30px;
      display: flex;
      justify-content: flex-end;
    }
    .sign-box {
      width: 250px;
      text-align: left;
      font-size: 11.5pt;
    }
    .sign-space {
      height: 70px;
    }
    .page-break {
      page-break-before: always;
      margin-top: 40px;
      padding-top: 25px;
      border-top: 1px dashed #cbd5e1;
    }
    @media print {
      body {
        background: #fff;
        padding: 0;
      }
      .no-print-toolbar {
        display: none !important;
      }
      .document-page {
        box-shadow: none;
        padding: 0;
        margin: 0;
        max-width: 100%;
      }
      .page-break {
        border-top: none;
        margin-top: 0;
        padding-top: 0;
      }
    }
  </style>
</head>
<body>
  <div class="no-print-toolbar">
    <div>
      <strong>Surat Keputusan Kepanitiaan Resmi</strong> &bull; No: ${skConfig.sk_number}
    </div>
    <div style="display: flex; gap: 8px;">
      <button class="btn-print" onclick="window.print()">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
        Cetak / Simpan ke PDF
      </button>
    </div>
  </div>

  <div class="document-page">
    <!-- Watermark Resmi E-PILEKTOS di tengah dokumen dengan opacity rendah -->
    <div class="watermark-overlay" aria-hidden="true">
      <img
        src="/logo-epilektos.png"
        alt="Watermark E-PILEKTOS"
        style="width: 100%; height: 100%; object-fit: contain; filter: grayscale(100%) contrast(120%);"
      />
    </div>
    <div class="doc-inner-content">
      <!-- Kop Surat Resmi (Sesuai Gaya BAHP) -->
    <div class="kop-header">
      <div style="width: 75px; height: 75px; display: flex; align-items: center; justify-content: center;">
        ${
          school.pemda_logo_url
            ? `<img src="${school.pemda_logo_url}" alt="Logo Pemda" class="kop-logo" onerror="this.style.display='none'">`
            : `<div style="width: 60px; height: 60px; border: 1px dashed #cbd5e1; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 8px; color: #94a3b8;">Logo Pemda</div>`
        }
      </div>
      <div class="kop-text">
        <div style="font-size: 11pt; font-weight: bold; letter-spacing: 0.5px; text-transform: uppercase;">
          ${isOsim ? 'KEMENTERIAN AGAMA REPUBLIK INDONESIA' : 'PEMERINTAH DAERAH / DINAS PENDIDIKAN'}
        </div>
        <h3 style="margin: 2px 0; font-size: 16pt; font-weight: 900; text-transform: uppercase; letter-spacing: 1px;">
          ${school.name}
        </h3>
        <p style="margin: 2px 0; font-size: 9.5pt;">${school.address} &bull; NPSN: ${school.npsn}</p>
        <p style="margin: 2px 0; font-size: 9pt; font-weight: bold; color: #334155;">
          PANITIA PEMILIHAN ${orgTypeUpper} TAHUN AJARAN ${academicYear}
        </p>
      </div>
      <div style="width: 75px; height: 75px; display: flex; align-items: center; justify-content: center;">
        ${
          school.logo_url
            ? `<img src="${school.logo_url}" alt="Logo Sekolah" class="kop-logo" onerror="this.style.display='none'">`
            : `<img src="/logo-epilektos.png" alt="Logo E-PILEKTOS DIGITAL" class="kop-logo" style="filter: grayscale(100%) contrast(125%);">`
        }
      </div>
    </div>

    <!-- Judul SK -->
    <div class="sk-title">
      <h4>SURAT KEPUTUSAN KEPALA ${schoolTypeUpper}</h4>
      <p>Nomor: ${skConfig.sk_number}</p>
    </div>

    <div class="about-box">
      TENTANG<br>
      PENETAPAN DAN PENGANGKATAN PANITIA PELAKSANA PEMILIHAN<br>
      KETUA DAN WAKIL KETUA ${orgTypeUpper}<br>
      TAHUN AJARAN ${academicYear}
    </div>

    <div style="text-align: center; font-weight: bold; margin-bottom: 12px;">
      DENGAN RAHMAT TUHAN YANG MAHA ESA<br>
      KEPALA ${school.name.toUpperCase()}
    </div>

    <table class="content-table">
      <tr>
        <td style="width: 120px; font-weight: bold;">Menimbang</td>
        <td style="width: 20px;">:</td>
        <td>
          <ol type="a" style="margin: 0; padding-left: 18px;">
            <li>Bahwa dalam rangka menjamin kelancaran, ketertiban, dan kesinambungan roda organisasi kesiswaan, perlu diselenggarakan pemilihan kepengurusan ${orgName};</li>
            <li>Bahwa untuk melaksanakan proses pemilihan secara demokratis, langsung, umum, bebas, rahasia, jujur, dan adil (LUBER JURDIL) berbasis digital, dipandang perlu mengangkat Panitia Pelaksana Pemilihan;</li>
            <li>Bahwa nama-nama yang tercantum dalam lampiran keputusan ini dipandang mampu dan memenuhi syarat untuk melaksanakan amanah tersebut.</li>
          </ol>
        </td>
      </tr>
      <tr>
        <td style="font-weight: bold;">Mengingat</td>
        <td>:</td>
        <td>
          <ol type="1" style="margin: 0; padding-left: 18px;">
            <li>Undang-Undang Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional;</li>
            <li>Peraturan Menteri Pendidikan Nasional Nomor 39 Tahun 2008 tentang Pembinaan Kesiswaan;</li>
            <li>Anggaran Dasar dan Anggaran Rumah Tangga (AD/ART) ${orgName};</li>
            <li>Program Kerja Kesiswaan ${school.name} Tahun Ajaran ${academicYear}.</li>
          </ol>
        </td>
      </tr>
      <tr>
        <td colspan="3" style="text-align: center; font-weight: bold; padding: 12px 0 6px 0;">
          MEMUTUSKAN:
        </td>
      </tr>
      <tr>
        <td style="font-weight: bold;">Menetapkan</td>
        <td>:</td>
        <td></td>
      </tr>
      <tr>
        <td style="font-weight: bold; padding-left: 12px;">PERTAMA</td>
        <td>:</td>
        <td>
          Mengangkat dan menetapkan Panitia Pelaksana Pemilihan Ketua dan Wakil Ketua ${orgName} Masa Bakti ${academicYear} dengan susunan personalia sebagaimana tercantum dalam Lampiran Keputusan ini.
        </td>
      </tr>
      <tr>
        <td style="font-weight: bold; padding-left: 12px;">KEDUA</td>
        <td>:</td>
        <td>
          Panitia sebagaimana dimaksud bertugas menyusun tata tertib pemilihan, verifikasi Daftar Pemilih Tetap (DPT), pendaftaran pasangan calon, pengelolaan bilik suara digital, hingga penyusunan Berita Acara Hasil Pemilihan (BAHP).
        </td>
      </tr>
      <tr>
        <td style="font-weight: bold; padding-left: 12px;">KETIGA</td>
        <td>:</td>
        <td>
          Segala biaya yang timbul akibat pelaksanaan keputusan ini dibebankan pada anggaran pembinaan kesiswaan yang relevan.
        </td>
      </tr>
      <tr>
        <td style="font-weight: bold; padding-left: 12px;">KEEMPAT</td>
        <td>:</td>
        <td>
          Keputusan ini mulai berlaku sejak tanggal ditetapkan, dengan ketentuan apabila di kemudian hari terdapat kekeliruan akan diadakan perbaikan sebagaimana mestinya.
        </td>
      </tr>
    </table>

    <div class="sign-section">
      <div class="sign-box">
        <p style="margin: 0;">Ditetapkan di: ${school.address ? school.address.split(',').pop()?.trim() || 'Tempat' : 'Tempat'}</p>
        <p style="margin: 2px 0 10px 0;">Pada tanggal: ${formattedDate}</p>
        <p style="margin: 0; font-weight: bold;">Kepala ${schoolType},</p>
        <div class="sign-space"></div>
        <p style="margin: 0; font-weight: bold; text-decoration: underline;">${school.principal_name}</p>
        <p style="margin: 0;">NIP. ${school.principal_nip}</p>
      </div>
    </div>

    <!-- LAMPIRAN SUSUNAN PANITIA (Lembar 2) -->
    <div class="page-break" style="position: relative; overflow: hidden; min-height: 297mm; padding-top: 20px;">
      <div class="watermark-overlay" aria-hidden="true">
        <img
          src="/logo-epilektos.png"
          alt="Watermark E-PILEKTOS"
          style="width: 100%; height: 100%; object-fit: contain; filter: grayscale(100%) contrast(120%);"
        />
      </div>
      <div style="position: relative; z-index: 1;">
        <div style="font-size: 11pt; margin-bottom: 16px;">
          <strong>LAMPIRAN KEPUTUSAN KEPALA ${schoolTypeUpper}</strong><br>
          Nomor: ${skConfig.sk_number}<br>
          Tanggal: ${formattedDate}<br>
          Tentang: Susunan Panitia Pelaksana ${periodName}
        </div>

      <h4 style="text-align: center; margin: 10px 0 16px 0; text-transform: uppercase; text-decoration: underline;">
        SUSUNAN PERSONALIA PANITIA PELAKSANA PEMILIHAN
      </h4>

      <table style="width: 100%; border-collapse: collapse; font-size: 11pt; margin-top: 10px;">
        <thead>
          <tr style="background: #f1f5f9;">
            <th style="border: 1px solid #333; padding: 8px; width: 40px; text-align: center;">NO</th>
            <th style="border: 1px solid #333; padding: 8px; text-align: left;">NAMA LENGKAP</th>
            <th style="border: 1px solid #333; padding: 8px; text-align: left;">JABATAN DALAM PANITIA</th>
            <th style="border: 1px solid #333; padding: 8px; text-align: left;">EMAIL / AKUN</th>
            <th style="border: 1px solid #333; padding: 8px; width: 80px; text-align: center;">STATUS</th>
          </tr>
        </thead>
        <tbody>
          ${committeeRows}
        </tbody>
      </table>

      <div class="sign-section" style="margin-top: 40px;">
        <div class="sign-box">
          <p style="margin: 0; font-weight: bold;">Kepala ${schoolType},</p>
          <div class="sign-space"></div>
          <p style="margin: 0; font-weight: bold; text-decoration: underline;">${school.principal_name}</p>
          <p style="margin: 0;">NIP. ${school.principal_nip}</p>
        </div>
      </div>
      </div>
    </div>
    </div>
  </div>
</body>
</html>`;

  // Buat blob dan trigger download file
  const fileName = skConfig.sk_file_name
    ? (skConfig.sk_file_name.toLowerCase().endsWith('.html') || skConfig.sk_file_name.toLowerCase().endsWith('.pdf')
        ? skConfig.sk_file_name.replace(/\.[^/.]+$/, '') + '.html'
        : `${skConfig.sk_file_name}.html`)
    : `SK_Kepanitiaan_${skConfig.sk_number.replace(/[^a-zA-Z0-9]/g, '_')}.html`;

  const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
