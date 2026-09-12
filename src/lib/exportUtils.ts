import { Voter } from '../types';

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
 * Unduh Template CSV untuk impor data DPT
 */
export function downloadDptTemplate(): void {
  const template = `NISN,Nama Lengkap,Kelas,Jenis Kelamin
0069876501,Arya Bagus Pratama,X-A,L
0069876502,Dewi Sartika Putri,X-A,P
0058765401,Muhammad Zaki Raihan,XI MIPA 1,L
0047654301,Siti Nurhaliza,XII IPS 2,P`;

  const blob = new Blob(['\uFEFF' + template], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'Template_Import_DPT_Siswa.csv');
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
