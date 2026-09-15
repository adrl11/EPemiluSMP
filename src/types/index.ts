export type OrganizationType = 'OSIS' | 'OSIM';
export type EducationLevel = 'SMP' | 'SMA';

export type ElectionStatus = 'draft' | 'aktif' | 'selesai';

export type UserRole = 'public' | 'siswa' | 'panitia' | 'admin';

export type PanitiaTab = 'dpt' | 'token' | 'paslon' | 'monitoring' | 'password';
export type AdminTab = 'sekolah' | 'periode' | 'panitia' | 'users' | 'audit_bahp' | 'password' | 'supabase';

export type AppUserRole = 'admin' | 'panitia' | 'operator' | 'pengawas';

export interface AppUser {
  id: string;
  name: string;
  email?: string;
  username: string;
  role: AppUserRole;
  password?: string;
  status: 'aktif' | 'nonaktif';
  created_at: string;
  last_login?: string;
}

export interface AuthUser {
  id?: string;
  role: 'panitia' | 'admin';
  name: string;
  email: string;
  username?: string;
  avatar?: string;
}

export interface School {
  id: string;
  name: string;
  npsn: string;
  type: OrganizationType;
  education_level?: EducationLevel;
  agency_name?: string; // Instansi Pembina / Dinas Pendidikan / Kemenag / Yayasan
  logo_url: string;
  pemda_logo_url?: string;
  address: string;
  principal_name: string;
  principal_nip: string;
}

export interface ElectionPeriod {
  id: string;
  school_id: string;
  period_name: string; // e.g. "Pemilihan Ketua OSIS 2026/2027"
  academic_year: string; // "2026/2027"
  status: ElectionStatus;
  start_date: string;
  end_date: string;
  created_at: string;
}

export interface Committee {
  id: string;
  election_period_id: string;
  sk_number: string;
  sk_date: string;
  sk_file_name?: string;
  sk_file_data?: string;
  member_name: string;
  role: 'Ketua Panitia' | 'Sekretaris' | 'Bendahara' | 'Seksi Bilik Suara' | 'Seksi Teknis IT' | 'Anggota';
  email: string;
  status: 'aktif' | 'nonaktif';
}

export interface CommitteeSKConfig {
  sk_number: string;
  sk_date: string;
  sk_file_name?: string;
  sk_file_data?: string;
}

export interface Candidate {
  id: string;
  election_period_id: string;
  ballot_number: number;
  chairman_name: string;
  vice_chairman_name: string;
  chairman_class: string;
  vice_chairman_class: string;
  photo_url: string;
  vision: string;
  mission: string[];
  programs: string[];
  video_url?: string;
  color_theme?: string;
}

export interface Voter {
  id: string;
  election_period_id: string;
  nisn: string;
  full_name: string;
  class_name: string;
  gender: 'L' | 'P';
  pin_hash: string;
  pin_plain: string; // Displayed for card generation prior to voting
  has_voted: boolean;
  voted_at: string | null;
}

export interface Vote {
  id: string;
  election_period_id: string;
  candidate_id: string;
  created_at: string; // Anonymous, decoupled from voter_id to preserve secrecy
}

export interface AuditLog {
  id: string;
  election_period_id: string;
  user_id: string;
  user_role: string;
  action: string;
  details: string;
  ip_address: string;
  timestamp: string;
}

export interface QuickCountStat {
  candidate_id: string;
  ballot_number: number;
  chairman_name: string;
  vice_chairman_name: string;
  votes_count: number;
  percentage: number;
  color: string;
}

export interface ElectionMetrics {
  total_dpt: number;
  total_voted: number;
  total_unvoted: number;
  participation_rate: number;
}
