-- ==============================================================================
-- SKEMA DATABASE SUPABASE (POSTGRESQL) - E-PILKETOS DIGITAL
-- Sistem Pemilihan Ketua & Wakil Ketua OSIS / MPK Terpadu
-- ==============================================================================
-- Petunjuk Penggunaan:
-- 1. Buka dashboard Supabase Anda di https://supabase.com
-- 2. Pilih Project Anda, lalu buka menu "SQL Editor" di bilah kiri.
-- 3. Klik "New query", paste seluruh kode SQL di bawah ini, lalu klik "Run".
-- 4. Semua tabel, relasi, RLS, indeks, dan data awal akan otomatis terbuat!
-- ==============================================================================

-- Aktifkan ekstensi UUID (jika diperlukan)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABEL PROFIL SEKOLAH / MADRASAH (schools)
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

-- 2. TABEL PERIODE PEMILIHAN (election_periods)
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

-- 3. TABEL SUSUNAN KEPANITIAAN SK (committees)
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

-- 4. TABEL PASANGAN CALON KETUA & WAKIL (candidates)
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

-- 5. TABEL DAFTAR PEMILIH TETAP / DPT (voters)
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

-- 6. TABEL BRANKAS SUARA SAH - ANOMIM (votes)
-- Mengikuti asas LUBER-JURDIL: Suara dicatat tanpa id/nisn pemilih agar rahasia mutlak
CREATE TABLE IF NOT EXISTS public.votes (
    id TEXT PRIMARY KEY,
    election_period_id TEXT REFERENCES public.election_periods(id) ON DELETE CASCADE,
    candidate_id TEXT REFERENCES public.candidates(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABEL AUDIT LOG & AKTIVITAS SISTEM (audit_logs)
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

-- 8. TABEL PENGGUNA APLIKASI (users)
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

-- ==============================================================================
-- INDEKS OPTIMASI UNTUK REAL-TIME QUICK COUNT & VERIFIKASI CEPAT
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_voters_nisn ON public.voters(nisn);
CREATE INDEX IF NOT EXISTS idx_voters_period ON public.voters(election_period_id);
CREATE INDEX IF NOT EXISTS idx_votes_period ON public.votes(election_period_id);
CREATE INDEX IF NOT EXISTS idx_votes_candidate ON public.votes(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidates_period ON public.candidates(election_period_id);
CREATE INDEX IF NOT EXISTS idx_audit_period ON public.audit_logs(election_period_id);

-- ==============================================================================
-- AKTIFKAN SUPABASE REALTIME (WebSockets)
-- ==============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'votes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE 
      public.schools, 
      public.election_periods, 
      public.committees, 
      public.candidates, 
      public.voters, 
      public.votes, 
      public.audit_logs, 
      public.users;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;

-- ==============================================================================
-- KEBIJAKAN ROW LEVEL SECURITY (RLS) - AKSES AMAN SATUAN PENDIDIKAN
-- ==============================================================================
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.election_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.committees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Kebijakan Akses Permissive (Anon & Authenticated untuk Aplikasi Web Sekolah)
CREATE POLICY "Allow public read schools" ON public.schools FOR SELECT USING (true);
CREATE POLICY "Allow public modify schools" ON public.schools FOR ALL USING (true);

CREATE POLICY "Allow public read periods" ON public.election_periods FOR SELECT USING (true);
CREATE POLICY "Allow public modify periods" ON public.election_periods FOR ALL USING (true);

CREATE POLICY "Allow public read committees" ON public.committees FOR SELECT USING (true);
CREATE POLICY "Allow public modify committees" ON public.committees FOR ALL USING (true);

CREATE POLICY "Allow public read candidates" ON public.candidates FOR SELECT USING (true);
CREATE POLICY "Allow public modify candidates" ON public.candidates FOR ALL USING (true);

CREATE POLICY "Allow public read voters" ON public.voters FOR SELECT USING (true);
CREATE POLICY "Allow public modify voters" ON public.voters FOR ALL USING (true);

CREATE POLICY "Allow public read votes" ON public.votes FOR SELECT USING (true);
CREATE POLICY "Allow public insert votes" ON public.votes FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read audit" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert audit" ON public.audit_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public modify users" ON public.users FOR ALL USING (true);

-- ==============================================================================
-- DATA AWAL BAWAAN (INITIAL SEED DATA)
-- ==============================================================================

-- 1. Data Sekolah
INSERT INTO public.schools (id, name, npsn, type, logo_url, address, principal_name, principal_nip)
VALUES (
    'sch-01',
    'SMA Negeri 1 Teladan Jakarta',
    '20108842',
    'OSIS',
    'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=150&auto=format&fit=crop&q=80',
    'Jl. Wijaya Kusuma No. 45, Kebayoran Baru, Jakarta Selatan',
    'Drs. H. Bambang Soedirman, M.Pd.',
    '197108151998021004'
) ON CONFLICT (id) DO NOTHING;

-- 2. Data Periode
INSERT INTO public.election_periods (id, school_id, period_name, academic_year, status, start_date, end_date)
VALUES 
(
    'period-2026',
    'sch-01',
    'Pemilihan Ketua & Wakil Ketua OSIS Periode 2026/2027',
    '2026/2027',
    'aktif',
    NOW() - INTERVAL '2 hours',
    NOW() + INTERVAL '6 hours'
),
(
    'period-2025',
    'sch-01',
    'Pemilihan Ketua & Wakil Ketua OSIS Periode 2025/2026',
    '2025/2026',
    'selesai',
    NOW() - INTERVAL '1 year',
    NOW() - INTERVAL '1 year' + INTERVAL '8 hours'
) ON CONFLICT (id) DO NOTHING;

-- 3. Data Panitia SK
INSERT INTO public.committees (id, election_period_id, sk_number, sk_date, sk_file_name, member_name, role, email, status)
VALUES
('com-01', 'period-2026', '421.3/089/SMAN1/IX/2026', '2026-09-01', 'SK_Kepanitiaan_Pilketos_2026_SMAN1.pdf', 'Aditya Surya Wibowo', 'Ketua Panitia', 'aditya.panitia@sman1teladan.sch.id', 'aktif'),
('com-02', 'period-2026', '421.3/089/SMAN1/IX/2026', '2026-09-01', 'SK_Kepanitiaan_Pilketos_2026_SMAN1.pdf', 'Nabila Putri Azzahra', 'Sekretaris', 'nabila.panitia@sman1teladan.sch.id', 'aktif'),
('com-03', 'period-2026', '421.3/089/SMAN1/IX/2026', '2026-09-01', 'SK_Kepanitiaan_Pilketos_2026_SMAN1.pdf', 'Fauzan Akbar Santoso', 'Seksi Teknis IT', 'fauzan.it@sman1teladan.sch.id', 'aktif'),
('com-04', 'period-2026', '421.3/089/SMAN1/IX/2026', '2026-09-01', 'SK_Kepanitiaan_Pilketos_2026_SMAN1.pdf', 'Clarissa Maharani', 'Seksi Bilik Suara', 'clarissa.bilik@sman1teladan.sch.id', 'aktif')
ON CONFLICT (id) DO NOTHING;

-- 4. Data Kandidat
INSERT INTO public.candidates (
    id, election_period_id, ballot_number, chairman_name, vice_chairman_name,
    chairman_class, vice_chairman_class, photo_url, vision, mission, programs, video_url, color_theme
)
VALUES
(
    'cand-01',
    'period-2026',
    1,
    'Muhammad Farhan Al-Fath',
    'Siti Aisyah Nurhaliza',
    'XI MIPA 1',
    'X-B',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    'Mewujudkan OSIS yang Progresif, Kolaboratif, dan Berakar pada Karakter Unggul Pelajar Pancasila.',
    '["Membangun wadah aspirasi siswa yang transparan melalui platform digital sekolah terpadu.", "Mengembangkan potensi talenta akademik dan non-akademik melalui festival sains dan seni berkala.", "Memperkuat program kepedulian sosial, ekoliterasi hijau, dan kepemimpinan inklusif bagi seluruh angkatan."]'::jsonb,
    '["Digital Voice Box (Wadah Aspirasi Siswa Anonim & Terverifikasi)", "Teladan Science & Art Fest 2027", "Green School Eco-Heroes & Gerakan Nol Sampah Plastik"]'::jsonb,
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'blue'
),
(
    'cand-02',
    'period-2026',
    2,
    'Raditya Pratama Nugroho',
    'Keisha Aurelia Putri',
    'XI IPS 2',
    'XI MIPA 3',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
    'OSIS Kreatif, Mandiri, Berteknologi, dan Responsif Terhadap Dinamika Kebutuhan Siswa Modern.',
    '["Optimalisasi media digital OSIS untuk publikasi prestasi dan informasi kegiatan secara real-time.", "Menyelenggarakan lokakarya kepemimpinan dan kewirausahaan kreatif bagi siswa.", "Menjalin kemitraan kolaboratif antar-ekstrakurikuler demi sinergi kegiatan yang produktif."]'::jsonb,
    '["Teladan Podcast & Creators Club", "Bazar Siswa Preneurship Berkelanjutan", "Forum Dialog Terbuka Siswa dan Pimpinan Sekolah"]'::jsonb,
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'emerald'
),
(
    'cand-03',
    'period-2026',
    3,
    'Dimas Arya Sena',
    'Zahra Amalia Sholiha',
    'XI MIPA 4',
    'X-F',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
    'Menciptakan Lingkungan Sekolah yang Suportif, Berintegritas Tinggi, dan Berdaya Saing Global.',
    '["Menumbuhkan kultur saling menghargai, bebas perundungan (anti-bullying), dan sehat mental.", "Meningkatkan prestasi lomba debat, karya tulis ilmiah, dan olahraga antar-sekolah.", "Menyediakan layanan mentoring sebaya (Peer Tutoring) untuk membantu pemahaman akademik siswa."]'::jsonb,
    '["Peer Tutoring Academic Circle", "Kampanye Sekolah Ramah & Anti-Bullying Squad", "Teladan Cup Sports & E-Sports Championship"]'::jsonb,
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'purple'
) ON CONFLICT (id) DO NOTHING;

-- 5. Data Pengguna (Users)
INSERT INTO public.users (id, name, email, username, role, password, status)
VALUES
('user-01', 'Drs. H. Bambang Soedirman, M.Pd.', 'admin@sman1teladan.sch.id', 'admin', 'admin123', 'admin', 'aktif'),
('user-02', 'Aditya Surya Wibowo', 'aditya.panitia@sman1teladan.sch.id', 'aditya', 'panitia123', 'panitia', 'aktif'),
('user-03', 'Nabila Putri Azzahra', 'nabila.panitia@sman1teladan.sch.id', 'nabila', 'panitia123', 'panitia', 'aktif'),
('user-04', 'Fauzan Akbar Santoso', 'fauzan.it@sman1teladan.sch.id', 'fauzan', 'panitia123', 'panitia', 'aktif'),
('user-05', 'Clarissa Maharani (Operator Bilik)', 'clarissa.bilik@sman1teladan.sch.id', 'clarissa', 'operator123', 'operator', 'aktif'),
('user-06', 'M. Rizky Ramadhan (Pengawas MPK)', 'pengawas@sman1teladan.sch.id', 'pengawas', 'pengawas123', 'pengawas', 'aktif')
ON CONFLICT (id) DO NOTHING;

-- 6. Sampel Daftar Pemilih Tetap (Voters DPT)
INSERT INTO public.voters (id, election_period_id, nisn, full_name, class_name, gender, pin_plain, pin_hash, has_voted, voted_at)
VALUES
('voter-01', 'period-2026', '0081234567', 'Ahmad Dani Saputra', 'X-A', 'L', '892144', '892144', true, NOW() - INTERVAL '45 minutes'),
('voter-02', 'period-2026', '0081234568', 'Annisa Zahra Rahmawati', 'X-A', 'P', '431902', '431902', true, NOW() - INTERVAL '30 minutes'),
('voter-03', 'period-2026', '0081234569', 'Bagus Prasetyo Utomo', 'X-A', 'L', '771239', '771239', false, NULL),
('voter-04', 'period-2026', '0081234570', 'Chelsea Olivia Putri', 'X-A', 'P', '312890', '312890', true, NOW() - INTERVAL '20 minutes'),
('voter-05', 'period-2026', '0081234571', 'Dika Pratama', 'X-B', 'L', '554312', '554312', false, NULL),
('voter-06', 'period-2026', '0081234572', 'Eka Nur Cahyani', 'X-B', 'P', '908231', '908231', true, NOW() - INTERVAL '10 minutes'),
('voter-07', 'period-2026', '0081234573', 'Faris Ihsan Maulana', 'X-B', 'L', '662194', '662194', false, NULL),
('voter-08', 'period-2026', '0081234574', 'Gita Gutawa Wibowo', 'X-B', 'P', '124985', '124985', false, NULL),
('voter-09', 'period-2026', '0071234575', 'Hafidz Syahputra', 'XI MIPA 1', 'L', '884321', '884321', true, NOW() - INTERVAL '50 minutes'),
('voter-10', 'period-2026', '0071234576', 'Intan Permata Sari', 'XI MIPA 1', 'P', '334912', '334912', true, NOW() - INTERVAL '40 minutes'),
('voter-11', 'period-2026', '0071234577', 'Joko Tri Wahyudi', 'XI MIPA 1', 'L', '991204', '991204', false, NULL),
('voter-12', 'period-2026', '0071234578', 'Karina Kartika Dewi', 'XI MIPA 1', 'P', '441923', '441923', true, NOW() - INTERVAL '25 minutes'),
('voter-13', 'period-2026', '0071234579', 'Lukman Hakim', 'XI IPS 1', 'L', '224901', '224901', false, NULL),
('voter-14', 'period-2026', '0071234580', 'Maya Anggraini', 'XI IPS 1', 'P', '773192', '773192', true, NOW() - INTERVAL '15 minutes'),
('voter-15', 'period-2026', '0061234581', 'Naufal Rizky', 'XII MIPA 2', 'L', '118492', '118492', true, NOW() - INTERVAL '55 minutes'),
('voter-16', 'period-2026', '0061234582', 'Olivia Triana', 'XII MIPA 2', 'P', '663921', '663921', false, NULL),
('voter-17', 'period-2026', '0061234583', 'Pandu Wijaya', 'XII MIPA 2', 'L', '882190', '882190', true, NOW() - INTERVAL '35 minutes'),
('voter-18', 'period-2026', '0061234584', 'Qonita Rahmania', 'XII IPS 2', 'P', '551982', '551982', true, NOW() - INTERVAL '18 minutes')
ON CONFLICT (id) DO NOTHING;

-- 7. Sampel Suara Awal (Votes)
INSERT INTO public.votes (id, election_period_id, candidate_id, created_at)
VALUES
('vote-s1', 'period-2026', 'cand-01', NOW() - INTERVAL '50 minutes'),
('vote-s2', 'period-2026', 'cand-01', NOW() - INTERVAL '45 minutes'),
('vote-s3', 'period-2026', 'cand-01', NOW() - INTERVAL '40 minutes'),
('vote-s4', 'period-2026', 'cand-01', NOW() - INTERVAL '35 minutes'),
('vote-s5', 'period-2026', 'cand-02', NOW() - INTERVAL '30 minutes'),
('vote-s6', 'period-2026', 'cand-02', NOW() - INTERVAL '25 minutes'),
('vote-s7', 'period-2026', 'cand-02', NOW() - INTERVAL '20 minutes'),
('vote-s8', 'period-2026', 'cand-03', NOW() - INTERVAL '18 minutes'),
('vote-s9', 'period-2026', 'cand-03', NOW() - INTERVAL '15 minutes'),
('vote-s10', 'period-2026', 'cand-01', NOW() - INTERVAL '10 minutes')
ON CONFLICT (id) DO NOTHING;
