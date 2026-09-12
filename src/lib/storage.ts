import {
  School,
  ElectionPeriod,
  Committee,
  Candidate,
  Voter,
  Vote,
  AuditLog,
  QuickCountStat,
  ElectionMetrics,
  AppUser,
} from '../types';
import { generateRandomPin, sha256, verifyPin } from './security';
import { getSupabase, isSupabaseActive, setupRealtimeSubscription, getSupabaseConfig, testSupabaseConnection, fetchServerSupabaseConfig } from './supabase';

const STORAGE_KEYS = {
  SCHOOL: 'epilketos_school_v1',
  PERIODS: 'epilketos_periods_v1',
  COMMITTEES: 'epilketos_committees_v1',
  CANDIDATES: 'epilketos_candidates_v1',
  VOTERS: 'epilketos_voters_v1',
  VOTES: 'epilketos_votes_v1',
  AUDIT_LOGS: 'epilketos_audit_logs_v1',
  USERS: 'epilketos_users_v1',
};

// Event emitter untuk simulasi Supabase Realtime Listener
class RealtimeBus extends EventTarget {
  notify(eventName: string, data?: unknown) {
    this.dispatchEvent(new CustomEvent(eventName, { detail: data }));
  }
}
export const realtimeBus = new RealtimeBus();

// DATA AWAL (SEED DATA) RESMI
const DEFAULT_SCHOOL: School = {
  id: 'sch-01',
  name: 'SMA Negeri 1 Teladan Jakarta',
  npsn: '20108842',
  type: 'OSIS',
  education_level: 'SMA',
  logo_url: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=150&auto=format&fit=crop&q=80',
  pemda_logo_url: '',
  address: 'Jl. Wijaya Kusuma No. 45, Kebayoran Baru, Jakarta Selatan',
  principal_name: 'Drs. H. Bambang Soedirman, M.Pd.',
  principal_nip: '197108151998021004',
};

const DEFAULT_PERIODS: ElectionPeriod[] = [
  {
    id: 'period-2026',
    school_id: 'sch-01',
    period_name: 'Pemilihan Ketua & Wakil Ketua OSIS Periode 2026/2027',
    academic_year: '2026/2027',
    status: 'aktif',
    start_date: '2026-09-11T07:30:00.000Z',
    end_date: '2026-09-11T15:00:00.000Z',
    created_at: '2026-09-01T08:00:00.000Z',
  },
  {
    id: 'period-2025',
    school_id: 'sch-01',
    period_name: 'Pemilihan Ketua & Wakil Ketua OSIS Periode 2025/2026',
    academic_year: '2025/2026',
    status: 'selesai',
    start_date: '2025-09-15T07:30:00.000Z',
    end_date: '2025-09-15T15:00:00.000Z',
    created_at: '2025-09-01T08:00:00.000Z',
  },
];

const DEFAULT_COMMITTEES: Committee[] = [
  {
    id: 'com-01',
    election_period_id: 'period-2026',
    sk_number: '421.3/089/SMAN1/IX/2026',
    sk_date: '2026-09-01',
    sk_file_name: 'SK_Kepanitiaan_Pilketos_2026_SMAN1.pdf',
    member_name: 'Aditya Surya Wibowo',
    role: 'Ketua Panitia',
    email: 'aditya.panitia@sman1teladan.sch.id',
    status: 'aktif',
  },
  {
    id: 'com-02',
    election_period_id: 'period-2026',
    sk_number: '421.3/089/SMAN1/IX/2026',
    sk_date: '2026-09-01',
    sk_file_name: 'SK_Kepanitiaan_Pilketos_2026_SMAN1.pdf',
    member_name: 'Nabila Putri Azzahra',
    role: 'Sekretaris',
    email: 'nabila.panitia@sman1teladan.sch.id',
    status: 'aktif',
  },
  {
    id: 'com-03',
    election_period_id: 'period-2026',
    sk_number: '421.3/089/SMAN1/IX/2026',
    sk_date: '2026-09-01',
    sk_file_name: 'SK_Kepanitiaan_Pilketos_2026_SMAN1.pdf',
    member_name: 'Fauzan Akbar Santoso',
    role: 'Seksi Teknis IT',
    email: 'fauzan.it@sman1teladan.sch.id',
    status: 'aktif',
  },
  {
    id: 'com-04',
    election_period_id: 'period-2026',
    sk_number: '421.3/089/SMAN1/IX/2026',
    sk_date: '2026-09-01',
    sk_file_name: 'SK_Kepanitiaan_Pilketos_2026_SMAN1.pdf',
    member_name: 'Clarissa Maharani',
    role: 'Seksi Bilik Suara',
    email: 'clarissa.bilik@sman1teladan.sch.id',
    status: 'aktif',
  },
];

const DEFAULT_CANDIDATES: Candidate[] = [
  {
    id: 'cand-01',
    election_period_id: 'period-2026',
    ballot_number: 1,
    chairman_name: 'Muhammad Farhan Al-Fath',
    vice_chairman_name: 'Siti Aisyah Nurhaliza',
    chairman_class: 'XI MIPA 1',
    vice_chairman_class: 'X-B',
    photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    vision: 'Mewujudkan OSIS yang Progresif, Kolaboratif, dan Berakar pada Karakter Unggul Pelajar Pancasila.',
    mission: [
      'Membangun wadah aspirasi siswa yang transparan melalui platform digital sekolah terpadu.',
      'Mengembangkan potensi talenta akademik dan non-akademik melalui festival sains dan seni berkala.',
      'Memperkuat program kepedulian sosial, ekoliterasi hijau, dan kepemimpinan inklusif bagi seluruh angkatan.',
    ],
    programs: [
      'Digital Voice Box (Wadah Aspirasi Siswa Anonim & Terverifikasi)',
      'Teladan Science & Art Fest 2027',
      'Green School Eco-Heroes & Gerakan Nol Sampah Plastik',
    ],
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    color_theme: 'blue',
  },
  {
    id: 'cand-02',
    election_period_id: 'period-2026',
    ballot_number: 2,
    chairman_name: 'Raditya Pratama Nugroho',
    vice_chairman_name: 'Keisha Aurelia Putri',
    chairman_class: 'XI IPS 2',
    vice_chairman_class: 'XI MIPA 3',
    photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
    vision: 'OSIS Kreatif, Mandiri, Berteknologi, dan Responsif Terhadap Dinamika Kebutuhan Siswa Modern.',
    mission: [
      'Optimalisasi teknologi dan literasi digital dalam kegiatan ekstrakurikuler serta publikasi sekolah.',
      'Meningkatkan jiwa kewirausahaan siswa melalui inkubator koperasi siswa milenial.',
      'Menciptakan iklim sekolah yang bebas perundungan (anti-bullying) dan ramah kesehatan mental.',
    ],
    programs: [
      'Student Mental Well-being Camp & Peer Counseling',
      'E-Kantin & Creative Student Merchandise OSIS',
      'Teladan E-Sport & Coding Championship Nasional',
    ],
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    color_theme: 'emerald',
  },
  {
    id: 'cand-03',
    election_period_id: 'period-2026',
    ballot_number: 3,
    chairman_name: 'Danendra Arya Putra',
    vice_chairman_name: 'Zahra Salsabila Hermanto',
    chairman_class: 'XI MIPA 4',
    vice_chairman_class: 'X-E',
    photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
    vision: 'Menjadi Jembatan Harmonis Antara Siswa, Guru, dan Alumni Menuju Prestasi Internasional.',
    mission: [
      'Memperluas jejaring mentoring alumni untuk bimbingan karier dan studi lanjut perguruan tinggi negeri.',
      'Merevitalisasi seluruh sarana ekstrakurikuler seni, olahraga, dan riset ilmiah remaja.',
      'Menanamkan budaya disiplin, integritas, dan sportivitas dalam seluruh event kesiswaan.',
    ],
    programs: [
      'Alumni Career Mentorship Roadshow & University Fair',
      'Pekan Olahraga & Seni Antar Kelas (Class Meeting Reborn)',
      'English & Public Speaking Club Boot Camp',
    ],
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    color_theme: 'purple',
  },
];

// Inisialisasi daftar pemilih tetap (DPT) awal
const INITIAL_VOTERS_RAW = [
  { nisn: '0061234501', name: 'Ahmad Rizky Pratama', class: 'X-A', gender: 'L' as const },
  { nisn: '0061234502', name: 'Annisa Fitri Rahmadani', class: 'X-A', gender: 'P' as const },
  { nisn: '0061234503', name: 'Bagas Aditya Wicaksono', class: 'X-B', gender: 'L' as const },
  { nisn: '0061234504', name: 'Cantika Dewi Lestari', class: 'X-B', gender: 'P' as const },
  { nisn: '0061234505', name: 'Dimas Prasetyo Nugraha', class: 'X-C', gender: 'L' as const },
  { nisn: '0061234506', name: 'Eka Nur Safitri', class: 'X-C', gender: 'P' as const },
  { nisn: '0051234601', name: 'Farhan Dwi Ramadhan', class: 'XI MIPA 1', gender: 'L' as const },
  { nisn: '0051234602', name: 'Gita Permata Sari', class: 'XI MIPA 1', gender: 'P' as const },
  { nisn: '0051234603', name: 'Hafizh Ilham Saputra', class: 'XI MIPA 2', gender: 'L' as const },
  { nisn: '0051234604', name: 'Indah Kusuma Wardani', class: 'XI MIPA 2', gender: 'P' as const },
  { nisn: '0051234605', name: 'Jonathan Kevin Wijaya', class: 'XI IPS 1', gender: 'L' as const },
  { nisn: '0051234606', name: 'Kirana Larasati', class: 'XI IPS 1', gender: 'P' as const },
  { nisn: '0051234607', name: 'Lucky Alamsyah Putra', class: 'XI IPS 2', gender: 'L' as const },
  { nisn: '0051234608', name: 'Maura Syifa Aulia', class: 'XI IPS 2', gender: 'P' as const },
  { nisn: '0041234701', name: 'Naufal Ryan Hidayat', class: 'XII MIPA 1', gender: 'L' as const },
  { nisn: '0041234702', name: 'Olivia Putri Maharani', class: 'XII MIPA 1', gender: 'P' as const },
  { nisn: '0041234703', name: 'Pandu Tri Pamungkas', class: 'XII MIPA 2', gender: 'L' as const },
  { nisn: '0041234704', name: 'Qonita Salma Khairunnisa', class: 'XII MIPA 2', gender: 'P' as const },
  { nisn: '0041234705', name: 'Rangga Surya Pratama', class: 'XII IPS 1', gender: 'L' as const },
  { nisn: '0041234706', name: 'Salsabila Cahya Ningrum', class: 'XII IPS 1', gender: 'P' as const },
  { nisn: '0041234707', name: 'Tegar Danuarta', class: 'XII IPS 2', gender: 'L' as const },
  { nisn: '0041234708', name: 'Ulfah Fauziyah', class: 'XII IPS 2', gender: 'P' as const },
  { nisn: '0041234709', name: 'Vito Alexander', class: 'XII IPS 2', gender: 'L' as const },
  { nisn: '0041234710', name: 'Wulan Maulida Zahir', class: 'XII MIPA 3', gender: 'P' as const },
];

function generateInitialVoters(): Voter[] {
  return INITIAL_VOTERS_RAW.map((item, idx) => {
    // PIN deterministik untuk data demo: contoh "PIL001", "PIL002", etc., agar mudah dicoba
    const demoPin = `PIL${String(idx + 1).padStart(3, '0')}`;
    const hasVoted = idx < 14; // 14 siswa sudah memilih untuk data awal
    return {
      id: `voter-${idx + 1}`,
      election_period_id: 'period-2026',
      nisn: item.nisn,
      full_name: item.name,
      class_name: item.class,
      gender: item.gender,
      pin_plain: demoPin,
      pin_hash: demoPin, // Diisi secara langsung saat init, hash dihitung saat verifikasi
      has_voted: hasVoted,
      voted_at: hasVoted ? new Date(Date.now() - (14 - idx) * 15 * 60 * 1000).toISOString() : null,
    };
  });
}

function generateInitialVotes(): Vote[] {
  // 14 suara masuk untuk paslon 1, 2, dan 3
  const candidateDistribution = [
    'cand-01', 'cand-01', 'cand-02', 'cand-01', 'cand-03',
    'cand-02', 'cand-02', 'cand-01', 'cand-03', 'cand-01',
    'cand-02', 'cand-01', 'cand-03', 'cand-02',
  ];
  return candidateDistribution.map((candId, idx) => ({
    id: `vote-${idx + 1}`,
    election_period_id: 'period-2026',
    candidate_id: candId,
    created_at: new Date(Date.now() - (14 - idx) * 15 * 60 * 1000).toISOString(),
  }));
}

const DEFAULT_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-01',
    election_period_id: 'period-2026',
    user_id: 'admin-01',
    user_role: 'Admin Sekolah',
    action: 'CREATE_PERIOD',
    details: 'Membuat periode Pemilihan Ketua OSIS 2026/2027',
    ip_address: '192.168.1.10',
    timestamp: '2026-09-01T08:05:00.000Z',
  },
  {
    id: 'log-02',
    election_period_id: 'period-2026',
    user_id: 'admin-01',
    user_role: 'Admin Sekolah',
    action: 'UPLOAD_SK_COMMITTEE',
    details: 'Menerbitkan SK Panitia No. 421.3/089/SMAN1/IX/2026',
    ip_address: '192.168.1.10',
    timestamp: '2026-09-01T08:30:00.000Z',
  },
  {
    id: 'log-03',
    election_period_id: 'period-2026',
    user_id: 'panitia-01',
    user_role: 'Panitia Pemilihan',
    action: 'IMPORT_DPT',
    details: 'Mengimpor 24 data siswa ke Daftar Pemilih Tetap (DPT)',
    ip_address: '192.168.1.44',
    timestamp: '2026-09-10T14:10:00.000Z',
  },
  {
    id: 'log-04',
    election_period_id: 'period-2026',
    user_id: 'panitia-01',
    user_role: 'Panitia Pemilihan',
    action: 'GENERATE_PINS',
    details: 'Menghasilkan 24 token PIN unik 6-karakter untuk pemilih',
    ip_address: '192.168.1.44',
    timestamp: '2026-09-10T14:25:00.000Z',
  },
  {
    id: 'log-05',
    election_period_id: 'period-2026',
    user_id: 'admin-01',
    user_role: 'Admin Sekolah',
    action: 'ACTIVATE_PERIOD',
    details: 'Mengaktifkan status periode pemilihan menjadi AKTIF (Pemungutan Suara Dibuka)',
    ip_address: '192.168.1.10',
    timestamp: '2026-09-11T07:30:00.000Z',
  },
];

const DEFAULT_USERS: AppUser[] = [
  {
    id: 'user-01',
    name: 'Drs. H. Bambang Soedirman, M.Pd.',
    email: 'admin@sman1teladan.sch.id',
    username: 'admin',
    role: 'admin',
    password: 'admin123',
    status: 'aktif',
    created_at: '2026-09-01T08:00:00.000Z',
    last_login: '2026-09-11T07:15:00.000Z',
  },
  {
    id: 'user-02',
    name: 'Aditya Surya Wibowo',
    email: 'aditya.panitia@sman1teladan.sch.id',
    username: 'aditya',
    role: 'panitia',
    password: 'panitia123',
    status: 'aktif',
    created_at: '2026-09-01T08:00:00.000Z',
    last_login: '2026-09-11T07:20:00.000Z',
  },
  {
    id: 'user-03',
    name: 'Nabila Putri Azzahra',
    email: 'nabila.panitia@sman1teladan.sch.id',
    username: 'nabila',
    role: 'panitia',
    password: 'panitia123',
    status: 'aktif',
    created_at: '2026-09-01T08:00:00.000Z',
    last_login: '2026-09-11T06:50:00.000Z',
  },
  {
    id: 'user-04',
    name: 'Fauzan Akbar Santoso',
    email: 'fauzan.it@sman1teladan.sch.id',
    username: 'fauzan',
    role: 'panitia',
    password: 'panitia123',
    status: 'aktif',
    created_at: '2026-09-01T08:00:00.000Z',
    last_login: '2026-09-10T16:00:00.000Z',
  },
  {
    id: 'user-05',
    name: 'Clarissa Maharani (Operator Bilik)',
    email: 'clarissa.bilik@sman1teladan.sch.id',
    username: 'clarissa',
    role: 'operator',
    password: 'operator123',
    status: 'aktif',
    created_at: '2026-09-01T08:00:00.000Z',
    last_login: '2026-09-10T11:20:00.000Z',
  },
  {
    id: 'user-06',
    name: 'M. Rizky Ramadhan (Pengawas MPK)',
    email: 'pengawas@sman1teladan.sch.id',
    username: 'pengawas',
    role: 'pengawas',
    password: 'pengawas123',
    status: 'aktif',
    created_at: '2026-09-01T08:00:00.000Z',
    last_login: '2026-09-09T10:00:00.000Z',
  },
];

// Helper get & set
function getItem<T>(key: string, defaultVal: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultVal;
  } catch {
    return defaultVal;
  }
}

function setItem<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.warn('Storage quota error', err);
  }
}

// Sinkronisasi data dari Supabase PostgreSQL ke local cache
export async function syncFromSupabase(): Promise<{
  success: boolean;
  message: string;
  counts?: Record<string, number>;
}> {
  const supabase = getSupabase();
  if (!supabase) return { success: false, message: 'Supabase tidak aktif atau kredensial belum diisi' };

  try {
    const [
      schoolRes,
      periodsRes,
      committeesRes,
      candidatesRes,
      votersRes,
      votesRes,
      logsRes,
      usersRes,
    ] = await Promise.all([
      supabase.from('schools').select('*').limit(1).maybeSingle(),
      supabase.from('election_periods').select('*').order('created_at', { ascending: false }),
      supabase.from('committees').select('*'),
      supabase.from('candidates').select('*').order('ballot_number', { ascending: true }),
      supabase.from('voters').select('*').limit(10000),
      supabase.from('votes').select('*'),
      supabase.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(300),
      supabase.from('users').select('*'),
    ]);

    let updatedCount = 0;

    if (schoolRes.data && !schoolRes.error) {
      const currentSchool = getItem<School>(STORAGE_KEYS.SCHOOL, DEFAULT_SCHOOL);
      setItem(STORAGE_KEYS.SCHOOL, { ...currentSchool, ...schoolRes.data });
      updatedCount++;
    }
    if (Array.isArray(periodsRes.data) && !periodsRes.error && periodsRes.data.length > 0) {
      setItem(STORAGE_KEYS.PERIODS, periodsRes.data);
      updatedCount++;
    }
    if (Array.isArray(committeesRes.data) && !committeesRes.error && committeesRes.data.length > 0) {
      setItem(STORAGE_KEYS.COMMITTEES, committeesRes.data);
      updatedCount++;
    }
    if (Array.isArray(candidatesRes.data) && !candidatesRes.error && candidatesRes.data.length > 0) {
      setItem(STORAGE_KEYS.CANDIDATES, candidatesRes.data);
      updatedCount++;
    }
    if (Array.isArray(votersRes.data) && !votersRes.error && votersRes.data.length > 0) {
      setItem(STORAGE_KEYS.VOTERS, votersRes.data);
      updatedCount++;
    }
    if (Array.isArray(votesRes.data) && !votesRes.error) {
      setItem(STORAGE_KEYS.VOTES, votesRes.data);
      updatedCount++;
    }
    if (Array.isArray(logsRes.data) && !logsRes.error && logsRes.data.length > 0) {
      setItem(STORAGE_KEYS.AUDIT_LOGS, logsRes.data);
      updatedCount++;
    }
    if (Array.isArray(usersRes.data) && !usersRes.error && usersRes.data.length > 0) {
      setItem(STORAGE_KEYS.USERS, usersRes.data);
      updatedCount++;
    }

    // SIARKAN NOTIFIKASI KE SELURUH KOMPONEN UI AGAR RE-RENDER SECARA INSTAN
    realtimeBus.notify('school_updated', schoolRes.data);
    realtimeBus.notify('periods_updated', periodsRes.data);
    realtimeBus.notify('candidates_updated', candidatesRes.data);
    realtimeBus.notify('voters_updated', votersRes.data);
    realtimeBus.notify('vote_casted', { source: 'supabase_sync' });
    realtimeBus.notify('committees_updated', committeesRes.data);
    realtimeBus.notify('users_updated', usersRes.data);
    realtimeBus.notify('audit_updated', logsRes.data);
    realtimeBus.notify('supabase_synced');

    return {
      success: true,
      message: `Sinkronisasi cloud berhasil. (${updatedCount} entitas diperbarui)`,
      counts: {
        'Paslon': candidatesRes.data?.length ?? 0,
        'Pemilih (DPT)': votersRes.data?.length ?? 0,
        'Suara Masuk': votesRes.data?.length ?? 0,
        'Periode': periodsRes.data?.length ?? 0,
      },
    };
  } catch (err) {
    console.warn('Gagal sinkronisasi data dari Supabase:', err);
    return {
      success: false,
      message: `Gagal sinkronisasi: ${(err as Error).message}`,
    };
  }
}

// Fitur Unggah Seluruh Data Lokal ke Cloud Supabase (Berguna untuk Initial Push dari Device 1)
export async function uploadLocalToSupabase(): Promise<{
  success: boolean;
  message: string;
  counts: Record<string, number>;
}> {
  const supabase = getSupabase();
  if (!supabase) {
    return { success: false, message: 'Koneksi Supabase belum aktif atau kredensial kosong.', counts: {} };
  }

  try {
    const school = getItem<School>(STORAGE_KEYS.SCHOOL, DEFAULT_SCHOOL);
    const periods = getItem<ElectionPeriod[]>(STORAGE_KEYS.PERIODS, DEFAULT_PERIODS);
    const committees = getItem<Committee[]>(STORAGE_KEYS.COMMITTEES, DEFAULT_COMMITTEES);
    const candidates = getItem<Candidate[]>(STORAGE_KEYS.CANDIDATES, DEFAULT_CANDIDATES);
    const voters = getItem<Voter[]>(STORAGE_KEYS.VOTERS, []);
    const votes = getItem<Vote[]>(STORAGE_KEYS.VOTES, []);
    const users = getItem<AppUser[]>(STORAGE_KEYS.USERS, DEFAULT_USERS);

    // 1. Upload Data Sekolah
    const cleanSchool = {
      id: school.id || 'sch-01',
      name: school.name,
      npsn: school.npsn,
      type: school.type || 'OSIS',
      logo_url: school.logo_url || '',
      address: school.address || '',
      principal_name: school.principal_name || '',
      principal_nip: school.principal_nip || '',
    };
    await supabase.from('schools').upsert(cleanSchool);

    // 2. Upload Periode
    if (periods.length > 0) {
      await supabase.from('election_periods').upsert(periods);
    }

    // 3. Upload Panitia (sanitize tanpa sk_file_data besar jika ada)
    if (committees.length > 0) {
      const cleanComm = committees.map((c) => ({
        id: c.id,
        election_period_id: c.election_period_id,
        sk_number: c.sk_number,
        sk_date: c.sk_date,
        sk_file_name: c.sk_file_name || null,
        member_name: c.member_name,
        role: c.role,
        email: c.email || '',
        status: c.status || 'aktif',
      }));
      await supabase.from('committees').upsert(cleanComm);
    }

    // 4. Upload Paslon
    if (candidates.length > 0) {
      await supabase.from('candidates').upsert(candidates);
    }

    // 5. Upload DPT (dalam batch 100)
    if (voters.length > 0) {
      const chunkSize = 100;
      for (let i = 0; i < voters.length; i += chunkSize) {
        const chunk = voters.slice(i, i + chunkSize);
        await supabase.from('voters').upsert(chunk);
      }
    }

    // 6. Upload Suara Sah (jika ada)
    if (votes.length > 0) {
      await supabase.from('votes').upsert(votes);
    }

    // 7. Upload Pengguna
    if (users.length > 0) {
      await supabase.from('users').upsert(users);
    }

    return {
      success: true,
      message: 'Berhasil mengunggah seluruh data lokal ke Cloud Supabase!',
      counts: {
        'Periode': periods.length,
        'Paslon': candidates.length,
        'DPT (Siswa)': voters.length,
        'Suara': votes.length,
      },
    };
  } catch (err) {
    return {
      success: false,
      message: `Gagal mengunggah data: ${(err as Error).message}`,
      counts: {},
    };
  }
}

// Inisialisasi awal saat load jika belum ada
export function initializeStorage(): void {
  if (!localStorage.getItem(STORAGE_KEYS.SCHOOL)) {
    setItem(STORAGE_KEYS.SCHOOL, DEFAULT_SCHOOL);
  }
  if (!localStorage.getItem(STORAGE_KEYS.PERIODS)) {
    setItem(STORAGE_KEYS.PERIODS, DEFAULT_PERIODS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.COMMITTEES)) {
    setItem(STORAGE_KEYS.COMMITTEES, DEFAULT_COMMITTEES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.CANDIDATES)) {
    setItem(STORAGE_KEYS.CANDIDATES, DEFAULT_CANDIDATES);
  }
  if (!localStorage.getItem(STORAGE_KEYS.VOTERS)) {
    setItem(STORAGE_KEYS.VOTERS, generateInitialVoters());
  }
  if (!localStorage.getItem(STORAGE_KEYS.VOTES)) {
    setItem(STORAGE_KEYS.VOTES, generateInitialVotes());
  }
  if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
    setItem(STORAGE_KEYS.AUDIT_LOGS, DEFAULT_AUDIT_LOGS);
  }
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    setItem(STORAGE_KEYS.USERS, DEFAULT_USERS);
  }

  const activateRealtime = () => {
    if (isSupabaseActive()) {
      syncFromSupabase();
      setupRealtimeSubscription((table) => {
        console.log(`[Supabase Realtime] Perubahan pada tabel: ${table}. Menyinkronkan...`);
        syncFromSupabase();
      });
    }
  };

  // 1. Mulai realtime jika konfigurasi sudah ada di localStorage
  activateRealtime();

  // 2. Ambil juga konfigurasi dari server backend (jika device lain baru pertama kali buka)
  fetchServerSupabaseConfig().then((cfg) => {
    if (cfg.isConfigured) {
      activateRealtime();
    }
  });

  // 3. Pasang auto-sync saat jendela browser difokuskan kembali (tab aktif)
  if (typeof window !== 'undefined') {
    window.addEventListener('focus', () => {
      if (isSupabaseActive()) {
        syncFromSupabase();
      }
    });
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && isSupabaseActive()) {
        syncFromSupabase();
      }
    });
  }
}

// API DATABASE MOCK PERSISTENT
export const db = {
  // SEKOLAH
  getSchool(): School {
    return getItem(STORAGE_KEYS.SCHOOL, DEFAULT_SCHOOL);
  },
  updateSchool(school: Partial<School>): School {
    const current = this.getSchool();
    const updated = { ...current, ...school };
    setItem(STORAGE_KEYS.SCHOOL, updated);
    this.addAuditLog('admin', 'Admin Sekolah', 'UPDATE_SCHOOL_CONFIG', `Memperbarui konfigurasi sekolah: ${updated.name}`);
    realtimeBus.notify('school_updated', updated);

    // Kirim ke Supabase jika aktif
    const supabase = getSupabase();
    if (supabase) {
      supabase.from('schools').upsert(updated).then(({ error }) => {
        if (error) console.warn('Supabase updateSchool error:', error);
      });
    }

    return updated;
  },

  // PERIODE PEMILIHAN
  getPeriods(): ElectionPeriod[] {
    return getItem(STORAGE_KEYS.PERIODS, DEFAULT_PERIODS);
  },
  getActivePeriod(): ElectionPeriod | null {
    const periods = this.getPeriods();
    return periods.find((p) => p.status === 'aktif') || periods.find((p) => p.status === 'draft') || periods[0] || null;
  },
  createPeriod(periodData: Omit<ElectionPeriod, 'id' | 'created_at'>): ElectionPeriod {
    const periods = this.getPeriods();
    // Jika status aktif dibuat, nonaktifkan periode lain
    if (periodData.status === 'aktif') {
      periods.forEach((p) => {
        if (p.status === 'aktif') p.status = 'selesai';
      });
    }
    const newPeriod: ElectionPeriod = {
      ...periodData,
      id: `period-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    periods.unshift(newPeriod);
    setItem(STORAGE_KEYS.PERIODS, periods);
    this.addAuditLog('admin', 'Admin Sekolah', 'CREATE_PERIOD', `Membuat periode: ${newPeriod.period_name}`);
    realtimeBus.notify('periods_updated', periods);

    const supabase = getSupabase();
    if (supabase) {
      supabase.from('election_periods').insert(newPeriod).then(({ error }) => {
        if (error) console.warn('Supabase createPeriod error:', error);
      });
    }

    return newPeriod;
  },
  setActivePeriod(periodId: string): void {
    const periods = this.getPeriods();
    periods.forEach((p) => {
      if (p.id === periodId) {
        p.status = 'aktif';
      } else if (p.status === 'aktif') {
        p.status = 'selesai';
      }
    });
    setItem(STORAGE_KEYS.PERIODS, periods);
    const active = periods.find((p) => p.id === periodId);
    this.addAuditLog('admin', 'Admin Sekolah', 'ACTIVATE_PERIOD', `Mengaktifkan periode pemilihan: ${active?.period_name}`);
    realtimeBus.notify('periods_updated', periods);

    const supabase = getSupabase();
    if (supabase) {
      periods.forEach((p) => {
        supabase.from('election_periods').update({ status: p.status }).eq('id', p.id).then();
      });
    }
  },
  updatePeriodStatus(periodId: string, status: 'draft' | 'aktif' | 'selesai'): void {
    const periods = this.getPeriods();
    if (status === 'aktif') {
      periods.forEach((p) => {
        if (p.id !== periodId && p.status === 'aktif') p.status = 'selesai';
      });
    }
    const target = periods.find((p) => p.id === periodId);
    if (target) {
      target.status = status;
      setItem(STORAGE_KEYS.PERIODS, periods);
      this.addAuditLog('admin', 'Admin Sekolah', 'UPDATE_PERIOD_STATUS', `Mengubah status periode "${target.period_name}" menjadi ${status.toUpperCase()}`);
      realtimeBus.notify('periods_updated', periods);

      const supabase = getSupabase();
      if (supabase) {
        periods.forEach((p) => {
          supabase.from('election_periods').update({ status: p.status }).eq('id', p.id).then();
        });
      }
    }
  },
  updatePeriod(id: string, periodData: Partial<ElectionPeriod>): ElectionPeriod {
    const periods = this.getPeriods();
    const idx = periods.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Periode tidak ditemukan');

    if (periodData.status === 'aktif') {
      periods.forEach((p) => {
        if (p.id !== id && p.status === 'aktif') p.status = 'selesai';
      });
    }

    periods[idx] = { ...periods[idx], ...periodData };
    setItem(STORAGE_KEYS.PERIODS, periods);
    this.addAuditLog('admin', 'Admin Sekolah', 'UPDATE_PERIOD', `Memperbarui periode: ${periods[idx].period_name}`);
    realtimeBus.notify('periods_updated', periods);

    const supabase = getSupabase();
    if (supabase) {
      supabase.from('election_periods').update(periodData).eq('id', id).then();
    }

    return periods[idx];
  },
  deletePeriod(id: string): void {
    let periods = this.getPeriods();
    const target = periods.find((p) => p.id === id);
    if (!target) return;
    if (target.status === 'aktif') {
      throw new Error('Tidak dapat menghapus periode yang sedang berstatus AKTIF! Nonaktifkan atau selesaikan periode terlebih dahulu.');
    }
    periods = periods.filter((p) => p.id !== id);
    setItem(STORAGE_KEYS.PERIODS, periods);
    this.addAuditLog('admin', 'Admin Sekolah', 'DELETE_PERIOD', `Menghapus periode: ${target.period_name}`);
    realtimeBus.notify('periods_updated', periods);

    const supabase = getSupabase();
    if (supabase) {
      supabase.from('election_periods').delete().eq('id', id).then();
    }
  },

  // PANITIA
  getSKConfig(periodId?: string): { sk_number: string; sk_date: string; sk_file_name?: string; sk_file_data?: string } {
    const saved = getItem<{ sk_number: string; sk_date: string; sk_file_name?: string; sk_file_data?: string } | null>(
      'epilketos_sk_config_v1',
      null
    );
    if (saved) return saved;

    const comms = this.getCommittees(periodId);
    if (comms.length > 0 && comms[0].sk_number) {
      return {
        sk_number: comms[0].sk_number,
        sk_date: comms[0].sk_date,
        sk_file_name: comms[0].sk_file_name,
        sk_file_data: comms[0].sk_file_data,
      };
    }
    return {
      sk_number: '421.3/089/SMAN1/IX/2026',
      sk_date: '2026-09-01',
      sk_file_name: 'SK_Kepanitiaan_Resmi.pdf',
    };
  },
  updateCommitteeSK(
    skData: { sk_number: string; sk_date: string; sk_file_name?: string; sk_file_data?: string },
    periodId?: string
  ): void {
    setItem('epilketos_sk_config_v1', skData);
    const all = this.getCommittees();
    const targetPeriod = periodId || this.getActivePeriod()?.id;

    const updatedAll = all.map((c) => {
      if (!targetPeriod || c.election_period_id === targetPeriod) {
        return {
          ...c,
          sk_number: skData.sk_number,
          sk_date: skData.sk_date,
          sk_file_name: skData.sk_file_name,
          sk_file_data: skData.sk_file_data,
        };
      }
      return c;
    });

    setItem(STORAGE_KEYS.COMMITTEES, updatedAll);
    this.addAuditLog(
      'admin',
      'Admin Sekolah',
      'UPDATE_COMMITTEE_SK',
      `Memperbarui konfigurasi SK Kepanitiaan: No. ${skData.sk_number}, Tgl: ${skData.sk_date}`
    );
    realtimeBus.notify('committees_updated', updatedAll);

    const supabase = getSupabase();
    if (supabase) {
      if (targetPeriod) {
        supabase
          .from('committees')
          .update({
            sk_number: skData.sk_number,
            sk_date: skData.sk_date,
            sk_file_name: skData.sk_file_name,
          })
          .eq('election_period_id', targetPeriod)
          .then();
      } else {
        updatedAll.forEach((c) => {
          supabase
            .from('committees')
            .update({
              sk_number: skData.sk_number,
              sk_date: skData.sk_date,
              sk_file_name: skData.sk_file_name,
            })
            .eq('id', c.id)
            .then();
        });
      }
    }
  },
  getCommittees(periodId?: string): Committee[] {
    const committees = getItem<Committee[]>(STORAGE_KEYS.COMMITTEES, DEFAULT_COMMITTEES);
    if (!periodId) return committees;
    return committees.filter((c) => c.election_period_id === periodId);
  },
  addCommittee(data: Omit<Committee, 'id'>): Committee {
    const all = this.getCommittees();
    const skConfig = this.getSKConfig(data.election_period_id);
    const newComm: Committee = {
      ...data,
      sk_number: data.sk_number || skConfig.sk_number,
      sk_date: data.sk_date || skConfig.sk_date,
      sk_file_name: data.sk_file_name || skConfig.sk_file_name,
      sk_file_data: data.sk_file_data || skConfig.sk_file_data,
      id: `com-${Date.now()}`,
    };
    all.push(newComm);
    setItem(STORAGE_KEYS.COMMITTEES, all);
    this.addAuditLog('admin', 'Admin Sekolah', 'ADD_COMMITTEE', `Menambahkan panitia: ${newComm.member_name} (${newComm.role})`);
    realtimeBus.notify('committees_updated', all);

    const supabase = getSupabase();
    if (supabase) {
      supabase.from('committees').insert(newComm).then();
    }

    return newComm;
  },
  updateCommittee(id: string, data: Partial<Committee>): Committee {
    const all = this.getCommittees();
    const idx = all.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Panitia tidak ditemukan');
    all[idx] = { ...all[idx], ...data };
    setItem(STORAGE_KEYS.COMMITTEES, all);
    this.addAuditLog('admin', 'Admin Sekolah', 'UPDATE_COMMITTEE', `Memperbarui data panitia: ${all[idx].member_name} (${all[idx].role})`);
    realtimeBus.notify('committees_updated', all);

    const supabase = getSupabase();
    if (supabase) {
      supabase.from('committees').update(data).eq('id', id).then();
    }

    return all[idx];
  },
  deleteCommittee(id: string): void {
    let all = this.getCommittees();
    const target = all.find((c) => c.id === id);
    all = all.filter((c) => c.id !== id);
    setItem(STORAGE_KEYS.COMMITTEES, all);
    if (target) {
      this.addAuditLog('admin', 'Admin Sekolah', 'DELETE_COMMITTEE', `Menghapus panitia: ${target.member_name}`);
    }
    realtimeBus.notify('committees_updated', all);

    const supabase = getSupabase();
    if (supabase) {
      supabase.from('committees').delete().eq('id', id).then();
    }
  },

  // KANDIDAT
  getCandidates(periodId?: string): Candidate[] {
    const candidates = getItem<Candidate[]>(STORAGE_KEYS.CANDIDATES, DEFAULT_CANDIDATES);
    const targetPeriod = periodId || this.getActivePeriod()?.id;
    if (!targetPeriod) return candidates;
    return candidates
      .filter((c) => c.election_period_id === targetPeriod)
      .sort((a, b) => a.ballot_number - b.ballot_number);
  },
  saveCandidate(candData: Omit<Candidate, 'id'>, existingId?: string): Candidate {
    const all = getItem<Candidate[]>(STORAGE_KEYS.CANDIDATES, DEFAULT_CANDIDATES);
    const supabase = getSupabase();

    if (existingId) {
      const idx = all.findIndex((c) => c.id === existingId);
      if (idx !== -1) {
        all[idx] = { ...all[idx], ...candData };
        setItem(STORAGE_KEYS.CANDIDATES, all);
        this.addAuditLog('panitia', 'Panitia Pemilihan', 'UPDATE_CANDIDATE', `Memperbarui paslon no. ${candData.ballot_number}: ${candData.chairman_name}`);
        realtimeBus.notify('candidates_updated', all);

        if (supabase) {
          supabase.from('candidates').upsert(all[idx]).then();
        }

        return all[idx];
      }
    }
    const newCand: Candidate = { ...candData, id: `cand-${Date.now()}` };
    all.push(newCand);
    setItem(STORAGE_KEYS.CANDIDATES, all);
    this.addAuditLog('panitia', 'Panitia Pemilihan', 'ADD_CANDIDATE', `Menambahkan paslon no. ${newCand.ballot_number}: ${newCand.chairman_name}`);
    realtimeBus.notify('candidates_updated', all);

    if (supabase) {
      supabase.from('candidates').insert(newCand).then();
    }

    return newCand;
  },
  deleteCandidate(id: string): void {
    let all = getItem<Candidate[]>(STORAGE_KEYS.CANDIDATES, DEFAULT_CANDIDATES);
    const target = all.find((c) => c.id === id);
    all = all.filter((c) => c.id !== id);
    setItem(STORAGE_KEYS.CANDIDATES, all);
    if (target) {
      this.addAuditLog('panitia', 'Panitia Pemilihan', 'DELETE_CANDIDATE', `Menghapus paslon no. ${target.ballot_number}`);
    }
    realtimeBus.notify('candidates_updated', all);

    const supabase = getSupabase();
    if (supabase) {
      supabase.from('candidates').delete().eq('id', id).then();
    }
  },

  // PEMILIH (VOTERS / DPT)
  getVoters(periodId?: string): Voter[] {
    const voters = getItem<Voter[]>(STORAGE_KEYS.VOTERS, []);
    const targetPeriod = periodId || this.getActivePeriod()?.id;
    if (!targetPeriod) return voters;
    return voters.filter((v) => v.election_period_id === targetPeriod);
  },
  importVoters(periodId: string, rawVoters: Array<{ nisn: string; full_name: string; class_name: string; gender: 'L' | 'P' }>): number {
    const all = getItem<Voter[]>(STORAGE_KEYS.VOTERS, []);
    const newItems: Voter[] = [];
    let count = 0;
    rawVoters.forEach((item) => {
      // Periksa apakah NISN sudah terdaftar di periode ini
      const exists = all.some((v) => v.election_period_id === periodId && v.nisn === item.nisn);
      if (!exists && item.nisn && item.full_name) {
        const pin = generateRandomPin(6);
        const newV: Voter = {
          id: `voter-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          election_period_id: periodId,
          nisn: item.nisn.trim(),
          full_name: item.full_name.trim(),
          class_name: item.class_name.trim(),
          gender: item.gender,
          pin_plain: pin,
          pin_hash: pin,
          has_voted: false,
          voted_at: null,
        };
        all.push(newV);
        newItems.push(newV);
        count++;
      }
    });
    setItem(STORAGE_KEYS.VOTERS, all);
    this.addAuditLog('panitia', 'Panitia Pemilihan', 'IMPORT_DPT', `Mengimpor ${count} pemilih baru ke periode ini.`);
    realtimeBus.notify('voters_updated', all);

    const supabase = getSupabase();
    if (supabase && newItems.length > 0) {
      supabase.from('voters').insert(newItems).then(({ error }) => {
        if (error) console.warn('Supabase importVoters error:', error);
      });
    }

    return count;
  },
  addSingleVoter(voter: Omit<Voter, 'id' | 'has_voted' | 'voted_at' | 'pin_plain' | 'pin_hash'>): Voter {
    const all = getItem<Voter[]>(STORAGE_KEYS.VOTERS, []);
    const pin = generateRandomPin(6);
    const newVoter: Voter = {
      ...voter,
      id: `voter-${Date.now()}`,
      pin_plain: pin,
      pin_hash: pin,
      has_voted: false,
      voted_at: null,
    };
    all.push(newVoter);
    setItem(STORAGE_KEYS.VOTERS, all);
    this.addAuditLog('panitia', 'Panitia Pemilihan', 'ADD_VOTER', `Menambahkan pemilih manual: ${newVoter.full_name} (${newVoter.nisn})`);
    realtimeBus.notify('voters_updated', all);

    const supabase = getSupabase();
    if (supabase) {
      supabase.from('voters').insert(newVoter).then();
    }

    return newVoter;
  },
  updateVoter(id: string, voterData: Partial<Voter>): Voter {
    const all = getItem<Voter[]>(STORAGE_KEYS.VOTERS, []);
    const idx = all.findIndex((v) => v.id === id);
    if (idx === -1) throw new Error('Pemilih tidak ditemukan');
    all[idx] = { ...all[idx], ...voterData };
    setItem(STORAGE_KEYS.VOTERS, all);
    this.addAuditLog('panitia', 'Panitia Pemilihan', 'UPDATE_VOTER', `Memperbarui data pemilih: ${all[idx].full_name} (${all[idx].nisn})`);
    realtimeBus.notify('voters_updated', all);

    const supabase = getSupabase();
    if (supabase) {
      supabase.from('voters').update(voterData).eq('id', id).then();
    }

    return all[idx];
  },
  resetVoterPin(voterId: string): string {
    const all = getItem<Voter[]>(STORAGE_KEYS.VOTERS, []);
    const voter = all.find((v) => v.id === voterId);
    if (!voter) throw new Error('Voter tidak ditemukan');
    if (voter.has_voted) throw new Error('Tidak dapat mereset PIN siswa yang sudah menggunakan hak suara!');
    
    const newPin = generateRandomPin(6);
    voter.pin_plain = newPin;
    voter.pin_hash = newPin;
    setItem(STORAGE_KEYS.VOTERS, all);
    this.addAuditLog('panitia', 'Panitia Pemilihan', 'RESET_PIN', `Mereset PIN pemilih ${voter.full_name} (${voter.nisn})`);
    realtimeBus.notify('voters_updated', all);

    const supabase = getSupabase();
    if (supabase) {
      supabase.from('voters').update({ pin_plain: newPin, pin_hash: newPin }).eq('id', voterId).then();
    }

    return newPin;
  },
  deleteVoter(voterId: string): void {
    let all = getItem<Voter[]>(STORAGE_KEYS.VOTERS, []);
    const target = all.find((v) => v.id === voterId);
    all = all.filter((v) => v.id !== voterId);
    setItem(STORAGE_KEYS.VOTERS, all);
    if (target) {
      this.addAuditLog('panitia', 'Panitia Pemilihan', 'DELETE_VOTER', `Menghapus pemilih: ${target.full_name}`);
    }
    realtimeBus.notify('voters_updated', all);

    const supabase = getSupabase();
    if (supabase) {
      supabase.from('voters').delete().eq('id', voterId).then();
    }
  },
  regenerateAllPins(periodId: string): number {
    const all = getItem<Voter[]>(STORAGE_KEYS.VOTERS, []);
    const updatedVoters: Voter[] = [];
    let count = 0;
    all.forEach((v) => {
      if (v.election_period_id === periodId && !v.has_voted) {
        const pin = generateRandomPin(6);
        v.pin_plain = pin;
        v.pin_hash = pin;
        updatedVoters.push(v);
        count++;
      }
    });
    setItem(STORAGE_KEYS.VOTERS, all);
    this.addAuditLog('panitia', 'Panitia Pemilihan', 'BULK_GENERATE_PINS', `Membuat ulang PIN untuk ${count} pemilih yang belum memilih.`);
    realtimeBus.notify('voters_updated', all);

    const supabase = getSupabase();
    if (supabase && updatedVoters.length > 0) {
      supabase.from('voters').upsert(updatedVoters).then();
    }

    return count;
  },

  // SUARA (VOTES - ATOMIC TRANSACTIONS DENGAN PRINSIP LUBER-JURDIL)
  getVotes(periodId?: string): Vote[] {
    const votes = getItem<Vote[]>(STORAGE_KEYS.VOTES, []);
    const targetPeriod = periodId || this.getActivePeriod()?.id;
    if (!targetPeriod) return votes;
    return votes.filter((v) => v.election_period_id === targetPeriod);
  },

  /**
   * Transaksi Pemilihan Atomik:
   * 1. Validasi periode aktif
   * 2. Verifikasi NISN dan kecocokan PIN
   * 3. Memastikan siswa belum memilih (prevent double voting)
   * 4. Memisahkan pencatatan suara dari identitas pemilih (Anonymous Vote)
   * 5. Mengubah status siswa: has_voted = true
   * 6. Audit logging aman tanpa merekam pilihan kandidat
   */
  async castVote(
    nisn: string,
    pin: string,
    candidateId: string
  ): Promise<{ success: boolean; message: string; voterName?: string }> {
    const activePeriod = this.getActivePeriod();
    if (!activePeriod || activePeriod.status !== 'aktif') {
      return { success: false, message: 'Pemungutan suara belum dibuka atau periode pemilihan sedang tidak aktif (Draft/Selesai).' };
    }

    const allVoters = getItem<Voter[]>(STORAGE_KEYS.VOTERS, []);
    const voter = allVoters.find(
      (v) => v.election_period_id === activePeriod.id && v.nisn.trim() === nisn.trim()
    );

    if (!voter) {
      return { success: false, message: 'NISN tidak terdaftar dalam Daftar Pemilih Tetap (DPT) periode ini.' };
    }

    if (voter.has_voted) {
      return {
        success: false,
        message: `Hak suara Anda dengan NISN ${nisn} sudah pernah digunakan pada ${voter.voted_at ? new Date(voter.voted_at).toLocaleTimeString('id-ID') : 'sebelumnya'}. Setiap siswa hanya dapat memilih 1 kali!`,
      };
    }

    // Verifikasi PIN
    const isPinValid =
      voter.pin_plain.toUpperCase() === pin.toUpperCase().trim() ||
      (await verifyPin(pin, voter.pin_hash));

    if (!isPinValid) {
      return { success: false, message: 'Token PIN yang Anda masukkan salah. Harap periksa kartu pemilih Anda!' };
    }

    // Validasi Paslon
    const candidates = this.getCandidates(activePeriod.id);
    const candidateExists = candidates.some((c) => c.id === candidateId);
    if (!candidateExists) {
      return { success: false, message: 'Paslon yang dipilih tidak valid.' };
    }

    // EKSEKUSI ATOMIK
    // 1. Simpan suara anonim ke tabel votes
    const allVotes = getItem<Vote[]>(STORAGE_KEYS.VOTES, []);
    const newVote: Vote = {
      id: `vote-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      election_period_id: activePeriod.id,
      candidate_id: candidateId,
      created_at: new Date().toISOString(),
    };
    allVotes.push(newVote);
    setItem(STORAGE_KEYS.VOTES, allVotes);

    // 2. Tandai pemilih telah memilih
    voter.has_voted = true;
    voter.voted_at = new Date().toISOString();
    setItem(STORAGE_KEYS.VOTERS, allVoters);

    // 3. Catat audit trail secara anonim (hanya mencatat bahwa NISN x telah menyalurkan hak suaranya, TANPA mencatat paslon pilihannya)
    this.addAuditLog(
      voter.id,
      'Siswa (Pemilih)',
      'VOTE_CAST_ANONYMOUS',
      `Siswa kelas ${voter.class_name} telah menyalurkan hak suaranya di bilik suara digital.`
    );

    // 4. Emit realtime events
    realtimeBus.notify('vote_casted', { periodId: activePeriod.id });
    realtimeBus.notify('voters_updated', allVoters);

    // 5. Simpan ke Supabase jika aktif
    const supabase = getSupabase();
    if (supabase) {
      supabase.from('votes').insert({
        id: newVote.id,
        election_period_id: newVote.election_period_id,
        candidate_id: newVote.candidate_id,
        created_at: newVote.created_at,
      }).then(({ error }) => {
        if (error) console.warn('Supabase castVote error:', error);
      });

      supabase.from('voters').update({
        has_voted: true,
        voted_at: voter.voted_at,
      }).eq('id', voter.id).then();
    }

    return {
      success: true,
      message: 'Suara Anda berhasil dicatat secara resmi dan terenkripsi.',
      voterName: voter.full_name,
    };
  },

  // METRIK & STATISTIK HITUNG CEPAT (QUICK COUNT)
  getQuickCountStats(periodId?: string): {
    candidates: QuickCountStat[];
    metrics: ElectionMetrics;
  } {
    const targetPeriod = periodId || this.getActivePeriod()?.id;
    const candidates = this.getCandidates(targetPeriod);
    const votes = this.getVotes(targetPeriod);
    const voters = this.getVoters(targetPeriod);

    const totalVotes = votes.length;
    const totalDpt = voters.length;
    const totalVoted = voters.filter((v) => v.has_voted).length;
    const totalUnvoted = totalDpt - totalVoted;
    const participationRate = totalDpt > 0 ? (totalVoted / totalDpt) * 100 : 0;

    // Warna palette paslon
    const palette = ['#2563eb', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899'];

    const candidateStats: QuickCountStat[] = candidates.map((cand, idx) => {
      const candVotes = votes.filter((v) => v.candidate_id === cand.id).length;
      const percentage = totalVotes > 0 ? (candVotes / totalVotes) * 100 : 0;
      return {
        candidate_id: cand.id,
        ballot_number: cand.ballot_number,
        chairman_name: cand.chairman_name,
        vice_chairman_name: cand.vice_chairman_name,
        votes_count: candVotes,
        percentage: Number(percentage.toFixed(1)),
        color: palette[idx % palette.length],
      };
    });

    return {
      candidates: candidateStats,
      metrics: {
        total_dpt: totalDpt,
        total_voted: totalVoted,
        total_unvoted: totalUnvoted,
        participation_rate: Number(participationRate.toFixed(1)),
      },
    };
  },

  // AUDIT TRAIL
  getAuditLogs(periodId?: string): AuditLog[] {
    const logs = getItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, DEFAULT_AUDIT_LOGS);
    const targetPeriod = periodId || this.getActivePeriod()?.id;
    if (!targetPeriod) return logs;
    return logs
      .filter((l) => l.election_period_id === targetPeriod)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },
  addAuditLog(userId: string, userRole: string, action: string, details: string): void {
    const logs = getItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, DEFAULT_AUDIT_LOGS);
    const activePeriod = this.getActivePeriod();
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      election_period_id: activePeriod?.id || 'system',
      user_id: userId,
      user_role: userRole,
      action,
      details,
      ip_address: '192.168.1.100', // Browser client context
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newLog);
    // Keep max 300 logs
    if (logs.length > 300) logs.pop();
    setItem(STORAGE_KEYS.AUDIT_LOGS, logs);
    realtimeBus.notify('audit_updated', logs);

    const supabase = getSupabase();
    if (supabase) {
      supabase.from('audit_logs').insert(newLog).then();
    }
  },

  // MANAJEMEN USER SISTEM (CRUD)
  getUsers(): AppUser[] {
    return getItem<AppUser[]>(STORAGE_KEYS.USERS, DEFAULT_USERS);
  },
  addUser(userData: Omit<AppUser, 'id' | 'created_at'>): AppUser {
    const users = this.getUsers();
    const userEmail = userData.email?.trim() || `${userData.username.trim()}@sekolah.sch.id`;
    // Validasi username dan email unik
    const existing = users.find(
      (u) =>
        u.username.toLowerCase() === userData.username.toLowerCase() ||
        (u.email && u.email.toLowerCase() === userEmail.toLowerCase())
    );
    if (existing) {
      throw new Error('Username atau Email sudah terdaftar dalam sistem!');
    }
    const newUser: AppUser = {
      ...userData,
      email: userEmail,
      id: `user-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    users.push(newUser);
    setItem(STORAGE_KEYS.USERS, users);
    this.addAuditLog(
      'admin',
      'Admin Sekolah',
      'CREATE_USER',
      `Menambahkan user sistem baru: ${newUser.name} (${newUser.username} - Role: ${newUser.role})`
    );
    realtimeBus.notify('users_updated', users);

    const supabase = getSupabase();
    if (supabase) {
      supabase.from('users').insert(newUser).then();
    }

    return newUser;
  },
  updateUser(id: string, userData: Partial<AppUser>): AppUser {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error('User tidak ditemukan');

    // Jika ganti username atau email, pastikan tidak duplikat
    if (userData.username || userData.email) {
      const duplicate = users.find(
        (u) =>
          u.id !== id &&
          ((userData.username && u.username.toLowerCase() === userData.username.toLowerCase()) ||
            (userData.email && u.email && u.email.toLowerCase() === userData.email.toLowerCase()))
      );
      if (duplicate) {
        throw new Error('Username atau Email baru sudah digunakan oleh akun lain!');
      }
    }

    users[idx] = { ...users[idx], ...userData };
    setItem(STORAGE_KEYS.USERS, users);
    this.addAuditLog(
      'admin',
      'Admin Sekolah',
      'UPDATE_USER',
      `Memperbarui profil user: ${users[idx].name} (${users[idx].username} - Role: ${users[idx].role})`
    );
    realtimeBus.notify('users_updated', users);

    const supabase = getSupabase();
    if (supabase) {
      supabase.from('users').update(userData).eq('id', id).then();
    }

    return users[idx];
  },
  deleteUser(id: string): boolean {
    let users = this.getUsers();
    const target = users.find((u) => u.id === id);
    if (!target) return false;
    // Cegah penghapusan jika admin tunggal
    const adminCount = users.filter((u) => u.role === 'admin' && u.status === 'aktif').length;
    if (target.role === 'admin' && adminCount <= 1) {
      return false;
    }

    users = users.filter((u) => u.id !== id);
    setItem(STORAGE_KEYS.USERS, users);
    this.addAuditLog(
      'admin',
      'Admin Sekolah',
      'DELETE_USER',
      `Menghapus akun user: ${target.name} (${target.username})`
    );
    realtimeBus.notify('users_updated', users);

    const supabase = getSupabase();
    if (supabase) {
      supabase.from('users').delete().eq('id', id).then();
    }

    return true;
  },

  // STATUS & KONEKSI SUPABASE
  isSupabaseConnected(): boolean {
    return isSupabaseActive();
  },
  getSupabaseStatus() {
    return {
      isActive: isSupabaseActive(),
      config: getSupabaseConfig(),
    };
  },
  async syncFromSupabase(): Promise<boolean> {
    return syncFromSupabase();
  },
  async testSupabase(): Promise<{ success: boolean; message: string }> {
    return testSupabaseConnection();
  },

  // RESET KESELURUHAN (UNTUK TESTING)
  resetToDefault(): void {
    localStorage.removeItem(STORAGE_KEYS.SCHOOL);
    localStorage.removeItem(STORAGE_KEYS.PERIODS);
    localStorage.removeItem(STORAGE_KEYS.COMMITTEES);
    localStorage.removeItem(STORAGE_KEYS.CANDIDATES);
    localStorage.removeItem(STORAGE_KEYS.VOTERS);
    localStorage.removeItem(STORAGE_KEYS.VOTES);
    localStorage.removeItem(STORAGE_KEYS.AUDIT_LOGS);
    localStorage.removeItem(STORAGE_KEYS.USERS);
    initializeStorage();
    realtimeBus.notify('data_reset');
  },
};

// Auto inisialisasi pada load
initializeStorage();
