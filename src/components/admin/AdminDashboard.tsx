import React, { useState, useEffect } from 'react';
import { School, ElectionPeriod, Committee, AuditLog, Candidate, QuickCountStat, ElectionMetrics, AdminTab, AppUser, AppUserRole, AuthUser } from '../../types';
import { db, realtimeBus } from '../../lib/storage';
import {
  ShieldCheck,
  Building,
  Calendar,
  FileCheck2,
  ScrollText,
  Plus,
  Trash2,
  CheckCircle2,
  FileText,
  Printer,
  X,
  Sparkles,
  Edit,
  UserPlus,
  User,
  Key,
  KeyRound,
  LogOut,
  Search,
  Users,
  Database,
  Download,
  Upload,
  Eye,
} from 'lucide-react';
import { PrintableBAHP } from '../print/PrintableBAHP';
import { PrintableSK } from '../print/PrintableSK';
import { Pagination } from '../common/Pagination';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import { ChangePasswordView } from '../common/ChangePasswordView';
import { SupabaseSettings } from './SupabaseSettings';
import { downloadSKDocument } from '../../lib/exportUtils';
import { compressImageFile } from '../../lib/imageUtils';

interface AdminDashboardProps {
  school: School;
  activePeriod: ElectionPeriod | null;
  onSchoolUpdated: (school: School) => void;
  activeTab?: AdminTab;
  onTabChange?: (tab: AdminTab) => void;
  authUser?: AuthUser | null;
  onLogout?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  school,
  activePeriod,
  onSchoolUpdated,
  activeTab: propTab,
  onTabChange,
  authUser,
  onLogout,
}) => {
  const [internalTab, setInternalTab] = useState<AdminTab>('sekolah');
  const activeTab = (propTab && (propTab as string) !== 'prd_docs') ? propTab : internalTab;

  const handleTabSelect = (tab: AdminTab) => {
    setInternalTab(tab);
    if (onTabChange) onTabChange(tab);
  };
  const [periods, setPeriods] = useState<ElectionPeriod[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isBahpPrintMode, setIsBahpPrintMode] = useState(false);
  const [isSkPrintMode, setIsSkPrintMode] = useState(false);

  // School config form
  const [schoolForm, setSchoolForm] = useState<School>(school);
  const [schoolSaveSuccess, setSchoolSaveSuccess] = useState(false);

  // Logo upload handlers for school & pemda
  const handleSchoolLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 300, 0.7);
      setSchoolForm((prev) => ({ ...prev, logo_url: compressed }));
    } catch (err) {
      alert((err as Error).message || 'Gagal memproses gambar logo.');
    }
  };

  const handlePemdaLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 300, 0.7);
      setSchoolForm((prev) => ({ ...prev, pemda_logo_url: compressed }));
    } catch (err) {
      alert((err as Error).message || 'Gagal memproses gambar logo.');
    }
  };
  
  // Period Modal (Create & Edit)
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<ElectionPeriod | null>(null);
  const [periodForm, setPeriodForm] = useState({
    period_name: '',
    academic_year: '2027/2028',
    status: 'draft' as 'draft' | 'aktif' | 'selesai',
    start_date: new Date().toISOString().slice(0, 16),
    end_date: new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 16),
  });

  // Committee Modal (Create & Edit)
  const [isCommitteeModalOpen, setIsCommitteeModalOpen] = useState(false);
  const [editingCommittee, setEditingCommittee] = useState<Committee | null>(null);
  const [committeeForm, setCommitteeForm] = useState({
    sk_number: '421.3/089/SMAN1/IX/2026',
    sk_date: '2026-09-01',
    sk_file_name: 'SK_Kepanitiaan_Resmi.pdf',
    member_name: '',
    role: 'Anggota' as Committee['role'],
    email: '',
    status: 'aktif' as 'aktif' | 'nonaktif',
  });

  // SK Kepanitiaan Configuration Modal State
  const [isSkModalOpen, setIsSkModalOpen] = useState(false);
  const [skConfigForm, setSkConfigForm] = useState<{
    sk_number: string;
    sk_date: string;
    sk_file_name: string;
    sk_file_data?: string;
  }>({
    sk_number: '421.3/089/SMAN1/IX/2026',
    sk_date: '2026-09-01',
    sk_file_name: 'SK_Kepanitiaan_Resmi.pdf',
    sk_file_data: undefined,
  });
  const [skSaveSuccess, setSkSaveSuccess] = useState(false);
  const [skDownloadedNotice, setSkDownloadedNotice] = useState(false);

  // User Management Modal (Create & Edit CRUD)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userForm, setUserForm] = useState({
    username: '',
    name: '',
    password: '',
    role: 'panitia' as AppUserRole,
    status: 'aktif' as 'aktif' | 'nonaktif',
  });

  // Delete Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'period' | 'committee' | 'user';
    item: any;
    name: string;
    warningDetails?: string;
    errorMessage?: string | null;
  }>({
    isOpen: false,
    type: 'period',
    item: null,
    name: '',
    errorMessage: null,
  });

  // Pagination states for data-heavy tables
  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(10);

  const [committeePage, setCommitteePage] = useState(1);
  const [committeePageSize, setCommitteePageSize] = useState(5);

  const [auditPage, setAuditPage] = useState(1);
  const [auditPageSize, setAuditPageSize] = useState(15);

  useEffect(() => {
    setUserPage(1);
  }, [userSearchQuery]);

  const loadAll = () => {
    setPeriods(db.getPeriods());
    setCommittees(db.getCommittees());
    setAuditLogs(db.getAuditLogs());
    setUsers(db.getUsers());
  };

  useEffect(() => {
    loadAll();
    const handleUpdate = () => loadAll();
    realtimeBus.addEventListener('periods_updated', handleUpdate);
    realtimeBus.addEventListener('committees_updated', handleUpdate);
    realtimeBus.addEventListener('audit_updated', handleUpdate);
    realtimeBus.addEventListener('school_updated', handleUpdate);
    realtimeBus.addEventListener('users_updated', handleUpdate);

    return () => {
      realtimeBus.removeEventListener('periods_updated', handleUpdate);
      realtimeBus.removeEventListener('committees_updated', handleUpdate);
      realtimeBus.removeEventListener('audit_updated', handleUpdate);
      realtimeBus.removeEventListener('school_updated', handleUpdate);
      realtimeBus.removeEventListener('users_updated', handleUpdate);
    };
  }, []);

  // Update School Configuration
  const handleSaveSchool = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = db.updateSchool(schoolForm);
    onSchoolUpdated(updated);
    setSchoolSaveSuccess(true);
    setTimeout(() => setSchoolSaveSuccess(false), 3000);
  };

  // Period CRUD Handlers
  const handleOpenAddPeriod = () => {
    setEditingPeriod(null);
    setPeriodForm({
      period_name: `Pemilihan Ketua & Wakil Ketua ${school.type} 2027/2028`,
      academic_year: '2027/2028',
      status: 'draft',
      start_date: new Date().toISOString().slice(0, 16),
      end_date: new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 16),
    });
    setIsPeriodModalOpen(true);
  };

  const handleEditPeriod = (p: ElectionPeriod) => {
    setEditingPeriod(p);
    setPeriodForm({
      period_name: p.period_name,
      academic_year: p.academic_year,
      status: p.status,
      start_date: new Date(p.start_date).toISOString().slice(0, 16),
      end_date: new Date(p.end_date).toISOString().slice(0, 16),
    });
    setIsPeriodModalOpen(true);
  };

  const handleSavePeriod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!periodForm.period_name.trim() || !periodForm.academic_year.trim()) {
      alert('Nama periode dan tahun ajaran wajib diisi!');
      return;
    }

    if (editingPeriod) {
      db.updatePeriod(editingPeriod.id, {
        period_name: periodForm.period_name.trim(),
        academic_year: periodForm.academic_year.trim(),
        status: periodForm.status,
        start_date: periodForm.start_date,
        end_date: periodForm.end_date,
      });
    } else {
      db.createPeriod({
        school_id: school.id,
        period_name: periodForm.period_name.trim(),
        academic_year: periodForm.academic_year.trim(),
        status: periodForm.status,
        start_date: periodForm.start_date,
        end_date: periodForm.end_date,
      });
    }
    setIsPeriodModalOpen(false);
    setEditingPeriod(null);
  };

  const handleDeletePeriod = (p: ElectionPeriod) => {
    if (p.status === 'aktif') {
      setDeleteModal({
        isOpen: true,
        type: 'period',
        item: p,
        name: p.period_name,
        warningDetails: 'Periode ini tidak dapat dihapus karena saat ini berstatus AKTIF.',
        errorMessage: 'Tidak dapat menghapus periode yang sedang berstatus AKTIF! Nonaktifkan atau alihkan status periode terlebih dahulu.',
      });
      return;
    }
    setDeleteModal({
      isOpen: true,
      type: 'period',
      item: p,
      name: p.period_name,
      warningDetails: 'Semua data pasangan calon dan rekapitulasi DPT terkait periode ini akan terhapus secara permanen.',
      errorMessage: null,
    });
  };

  // Activate Period
  const handleActivatePeriod = (p: ElectionPeriod) => {
    if (
      confirm(
        `Aktifkan periode "${p.period_name}"? Hanya 1 periode yang dapat aktif dalam satu waktu. Periode aktif saat ini akan diselesaikan/dinonaktifkan.`
      )
    ) {
      db.setActivePeriod(p.id);
    }
  };

  // SK Kepanitiaan Handlers
  const handleOpenSkModal = () => {
    const currentSk = db.getSKConfig(activePeriod?.id);
    setSkConfigForm({
      sk_number: currentSk.sk_number || '421.3/089/SMAN1/IX/2026',
      sk_date: currentSk.sk_date || '2026-09-01',
      sk_file_name: currentSk.sk_file_name || 'SK_Kepanitiaan_Resmi.pdf',
      sk_file_data: currentSk.sk_file_data,
    });
    setIsSkModalOpen(true);
  };

  const handleSaveSkConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skConfigForm.sk_number.trim() || !skConfigForm.sk_date) {
      alert('Nomor SK dan Tanggal Pengesahan wajib diisi!');
      return;
    }

    db.updateCommitteeSK(
      {
        sk_number: skConfigForm.sk_number.trim(),
        sk_date: skConfigForm.sk_date,
        sk_file_name: skConfigForm.sk_file_name.trim() || 'SK_Kepanitiaan_Resmi.pdf',
        sk_file_data: skConfigForm.sk_file_data,
      },
      activePeriod?.id
    );

    loadAll();
    setIsSkModalOpen(false);
    setSkSaveSuccess(true);
    setTimeout(() => setSkSaveSuccess(false), 3500);
  };

  const handleDownloadSk = () => {
    const currentSk = db.getSKConfig(activePeriod?.id);
    downloadSKDocument(school, activePeriod, committees, currentSk);
    setSkDownloadedNotice(true);
    setTimeout(() => setSkDownloadedNotice(false), 4000);
  };

  const handleSkFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran file maksimal 10MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setSkConfigForm((prev) => ({
        ...prev,
        sk_file_name: file.name,
        sk_file_data: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  // Committee CRUD Handlers
  const handleOpenAddCommittee = () => {
    setEditingCommittee(null);
    const currentSk = db.getSKConfig(activePeriod?.id);
    setCommitteeForm({
      sk_number: currentSk.sk_number,
      sk_date: currentSk.sk_date,
      sk_file_name: currentSk.sk_file_name || 'SK_Kepanitiaan_Resmi.pdf',
      member_name: '',
      role: 'Anggota',
      email: '',
      status: 'aktif',
    });
    setIsCommitteeModalOpen(true);
  };

  const handleEditCommittee = (c: Committee) => {
    setEditingCommittee(c);
    setCommitteeForm({
      sk_number: c.sk_number,
      sk_date: c.sk_date,
      sk_file_name: c.sk_file_name,
      member_name: c.member_name,
      role: c.role,
      email: c.email,
      status: c.status,
    });
    setIsCommitteeModalOpen(true);
  };

  const handleSaveCommittee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePeriod) {
      alert('Tidak ada periode aktif!');
      return;
    }

    if (editingCommittee) {
      db.updateCommittee(editingCommittee.id, {
        sk_number: committeeForm.sk_number.trim(),
        sk_date: committeeForm.sk_date,
        sk_file_name: committeeForm.sk_file_name,
        member_name: committeeForm.member_name.trim(),
        role: committeeForm.role,
        email: committeeForm.email.trim(),
        status: committeeForm.status,
      });
    } else {
      db.addCommittee({
        election_period_id: activePeriod.id,
        sk_number: committeeForm.sk_number.trim(),
        sk_date: committeeForm.sk_date,
        sk_file_name: committeeForm.sk_file_name,
        member_name: committeeForm.member_name.trim(),
        role: committeeForm.role,
        email: committeeForm.email.trim(),
        status: committeeForm.status,
      });
    }
    setIsCommitteeModalOpen(false);
    setEditingCommittee(null);
  };

  // User CRUD Handlers (Tambah User / CRUD)
  const handleOpenAddUser = () => {
    setEditingUser(null);
    setUserForm({
      username: '',
      name: '',
      password: '',
      role: 'panitia',
      status: 'aktif',
    });
    setIsUserModalOpen(true);
  };

  const handleEditUser = (u: AppUser) => {
    setEditingUser(u);
    setUserForm({
      username: u.username,
      name: u.name,
      password: '', // leave empty to keep unchanged
      role: u.role,
      status: u.status,
    });
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = userForm.username.trim().toLowerCase();
    const cleanName = userForm.name.trim();

    if (!cleanUsername || !cleanName) {
      alert('Username dan Nama Lengkap wajib diisi!');
      return;
    }

    if (!editingUser && !userForm.password.trim()) {
      alert('Kata sandi (password) wajib diisi saat menambahkan pengguna baru!');
      return;
    }

    try {
      if (editingUser) {
        const updatePayload: Partial<AppUser> = {
          username: cleanUsername,
          name: cleanName,
          role: userForm.role,
          status: userForm.status,
        };
        if (userForm.password.trim()) {
          updatePayload.password = userForm.password.trim();
        }
        db.updateUser(editingUser.id, updatePayload);
      } else {
        db.addUser({
          username: cleanUsername,
          name: cleanName,
          password: userForm.password.trim(),
          role: userForm.role,
          status: userForm.status,
        });
      }

      setIsUserModalOpen(false);
      setEditingUser(null);
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan saat memproses data pengguna.');
    }
  };

  const handleDeleteCommittee = (c: Committee) => {
    setDeleteModal({
      isOpen: true,
      type: 'committee',
      item: c,
      name: `${c.member_name} (${c.role})`,
      warningDetails: 'Anggota panitia ini akan dikeluarkan dari struktur susunan SK Kepanitiaan.',
      errorMessage: null,
    });
  };

  const handleDeleteUser = (u: AppUser) => {
    const activeAdmins = users.filter((x) => x.role === 'admin' && x.status === 'aktif');
    if (u.role === 'admin' && activeAdmins.length <= 1) {
      setDeleteModal({
        isOpen: true,
        type: 'user',
        item: u,
        name: `${u.name} (@${u.username})`,
        warningDetails: 'Sistem membutuhkan setidaknya satu akun Administrator aktif.',
        errorMessage: 'Tidak dapat menghapus! Sistem mewajibkan minimal harus ada 1 akun Administrator berstatus aktif.',
      });
      return;
    }
    setDeleteModal({
      isOpen: true,
      type: 'user',
      item: u,
      name: `${u.name} (@${u.username})`,
      warningDetails: 'Akun ini tidak akan dapat login lagi ke dalam sistem portal pemilihan.',
      errorMessage: null,
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteModal.item) return;

    if (deleteModal.type === 'period') {
      db.deletePeriod(deleteModal.item.id);
      loadAll();
    } else if (deleteModal.type === 'committee') {
      db.deleteCommittee(deleteModal.item.id);
      loadAll();
    } else if (deleteModal.type === 'user') {
      const success = db.deleteUser(deleteModal.item.id);
      if (!success) {
        setDeleteModal((prev) => ({
          ...prev,
          errorMessage: 'Gagal menghapus! Sistem mewajibkan minimal harus ada 1 akun Administrator berstatus aktif.',
        }));
        return;
      }
      loadAll();
    }

    setDeleteModal({ isOpen: false, type: 'period', item: null, name: '', errorMessage: null });
  };

  // Stats for BAHP
  const statsRes = activePeriod ? db.getQuickCountStats(activePeriod.id) : null;
  const currentCandidates = activePeriod ? db.getCandidates(activePeriod.id) : [];

  if (isBahpPrintMode && activePeriod && statsRes) {
    return (
      <PrintableBAHP
        school={school}
        activePeriod={activePeriod}
        candidates={currentCandidates}
        stats={statsRes.candidates}
        metrics={statsRes.metrics}
        committees={committees}
        onBack={() => setIsBahpPrintMode(false)}
      />
    );
  }

  if (isSkPrintMode && activePeriod) {
    const activeSk = db.getSKConfig(activePeriod.id);
    return (
      <PrintableSK
        school={school}
        activePeriod={activePeriod}
        committees={committees}
        skConfig={activeSk}
        onBack={() => setIsSkPrintMode(false)}
      />
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Admin Header Banner */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-slate-900 text-white shadow-2xs">
              Portal Eksekutif &bull; Administrator
            </span>
            <span className="text-xs text-slate-400 font-medium">NPSN: {school.npsn}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2 tracking-tight">
            Pengaturan Satuan Pendidikan &amp; Pengesahan Pemilihan
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Konfigurasi identitas institusi, pembentukan SK panitia, pergantian periode tahunan, manajemen akun pengguna portal, dan penerbitan Berita Acara Hasil Pemilihan (BAHP).
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
          <div className="bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-xl text-left sm:text-right">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Periode Pemilihan Aktif</p>
            <p className="text-xs font-black text-slate-800 truncate max-w-[220px] mt-0.5">
              {activePeriod?.period_name || 'Belum ada periode aktif'}
            </p>
          </div>
        </div>
      </div>

      {/* Admin Full-Width Tab Navigation Bar */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <button
          onClick={() => handleTabSelect('sekolah')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'sekolah'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building className="w-4 h-4" />
          <span>Profil Sekolah/Madrasah</span>
        </button>

        <button
          onClick={() => handleTabSelect('periode')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'periode'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Manajemen Periode</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'periode' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {periods.length}
          </span>
        </button>

        <button
          onClick={() => handleTabSelect('panitia')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'panitia'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>SK &amp; Panitia</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'panitia' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {committees.length}
          </span>
        </button>

        <button
          onClick={() => handleTabSelect('users')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'users'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-blue-900 hover:bg-blue-50'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah User (CRUD)</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'users' ? 'bg-white/25 text-white' : 'bg-blue-100 text-blue-800'
            }`}
          >
            {users.length}
          </span>
        </button>

        <button
          onClick={() => handleTabSelect('audit_bahp')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'audit_bahp'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ScrollText className="w-4 h-4" />
          <span>Audit &amp; Berita Acara (BAHP)</span>
        </button>

        <button
          onClick={() => handleTabSelect('supabase')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'supabase'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-emerald-900 hover:bg-emerald-50'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Database Supabase</span>
          <span
            className={`w-2 h-2 rounded-full ${
              db.isSupabaseConnected() ? 'bg-emerald-300 animate-pulse' : 'bg-slate-300'
            }`}
          />
        </button>

        <button
          onClick={() => handleTabSelect('password')}
          className={`ml-auto px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'password'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Ganti Password</span>
        </button>
      </div>

      {/* TAB 1: KONFIGURASI SATUAN PENDIDIKAN */}
      {activeTab === 'sekolah' && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-xs max-w-3xl">
          <div className="mb-6 pb-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">
              Identitas Satuan Pendidikan &amp; Jenis Lembaga
            </h3>
            <p className="text-xs text-slate-500">
              Pengaturan jenis kepengurusan: OSIS untuk Sekolah Menengah atau OSIM untuk Madrasah Tsanawiyah/Aliyah
            </p>
          </div>

          {schoolSaveSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Konfigurasi sekolah berhasil diperbarui secara permanen!</span>
            </div>
          )}

          <form onSubmit={handleSaveSchool} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Resmi Sekolah / Madrasah
                </label>
                <input
                  type="text"
                  value={schoolForm.name}
                  onChange={(e) => setSchoolForm({ ...schoolForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">NPSN</label>
                <input
                  type="text"
                  value={schoolForm.npsn}
                  onChange={(e) => setSchoolForm({ ...schoolForm, npsn: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                  required
                />
              </div>
            </div>

            {/* Instansi Pembina / Dinas Pendidikan / Yayasan */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                <label className="block font-bold text-slate-700">
                  Instansi Pembina / Dinas Pendidikan / Yayasan (Baris Atas Kop Surat)
                </label>
                <span className="text-[10px] text-slate-500 font-normal">
                  Dicetak pada baris teratas Kop Dokumen Resmi (SK & BAHP)
                </span>
              </div>
              <input
                type="text"
                value={schoolForm.agency_name || ''}
                onChange={(e) => setSchoolForm({ ...schoolForm, agency_name: e.target.value })}
                placeholder="Contoh: PEMERINTAH DAERAH PROVINSI JAWA BARAT / DINAS PENDIDIKAN"
                className="w-full p-2.5 rounded-xl border border-slate-300 font-semibold"
              />
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span className="text-[10px] font-bold text-slate-500 mr-1">Preset Cepat:</span>
                <button
                  type="button"
                  onClick={() => setSchoolForm({ ...schoolForm, agency_name: 'PEMERINTAH DAERAH / DINAS PENDIDIKAN' })}
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-medium transition-colors cursor-pointer"
                >
                  Dinas Pendidikan Umum
                </button>
                <button
                  type="button"
                  onClick={() => setSchoolForm({ ...schoolForm, agency_name: 'PEMERINTAH PROVINSI DAERAH / DINAS PENDIDIKAN' })}
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-medium transition-colors cursor-pointer"
                >
                  Dinas Pemprov (SMA/SMK)
                </button>
                <button
                  type="button"
                  onClick={() => setSchoolForm({ ...schoolForm, agency_name: 'PEMERINTAH KABUPATEN / KOTA / DINAS PENDIDIKAN' })}
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-medium transition-colors cursor-pointer"
                >
                  Dinas Kab/Kota (SMP)
                </button>
                <button
                  type="button"
                  onClick={() => setSchoolForm({ ...schoolForm, agency_name: 'KEMENTERIAN AGAMA REPUBLIK INDONESIA' })}
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-medium transition-colors cursor-pointer"
                >
                  Kemenag RI (MTs/MA)
                </button>
                <button
                  type="button"
                  onClick={() => setSchoolForm({ ...schoolForm, agency_name: 'YAYASAN PENDIDIKAN' })}
                  className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-medium transition-colors cursor-pointer"
                >
                  Yayasan Swasta
                </button>
              </div>
            </div>

            {/* Jenis Organisasi: OSIS vs OSIM */}
            <div>
              <label className="block font-bold text-slate-700 mb-2">
                Jenis Kepengurusan Organisasi Siswa
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label
                  className={`p-3.5 rounded-xl border-2 flex items-center gap-3 cursor-pointer transition-all ${
                    schoolForm.type === 'OSIS'
                      ? 'border-blue-600 bg-blue-50/60 text-blue-950 font-bold'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="orgType"
                    checked={schoolForm.type === 'OSIS'}
                    onChange={() => setSchoolForm({ ...schoolForm, type: 'OSIS' })}
                    className="accent-blue-600"
                  />
                  <div>
                    <div className="text-xs font-extrabold">OSIS (Sekolah Umum)</div>
                    <div className="text-[11px] text-slate-500 font-normal">
                      Organisasi Siswa Intra Sekolah (SMA / SMK / SMP)
                    </div>
                  </div>
                </label>

                <label
                  className={`p-3.5 rounded-xl border-2 flex items-center gap-3 cursor-pointer transition-all ${
                    schoolForm.type === 'OSIM'
                      ? 'border-emerald-600 bg-emerald-50/60 text-emerald-950 font-bold'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="orgType"
                    checked={schoolForm.type === 'OSIM'}
                    onChange={() => setSchoolForm({ ...schoolForm, type: 'OSIM' })}
                    className="accent-emerald-600"
                  />
                  <div>
                    <div className="text-xs font-extrabold">OSIM (Madrasah)</div>
                    <div className="text-[11px] text-slate-500 font-normal">
                      Organisasi Santri Intra Madrasah (MA / MTs)
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Jenjang Tingkat Pendidikan: SMP/MTs vs SMA/SMK/MA */}
            <div>
              <label className="block font-bold text-slate-700 mb-2">
                Jenjang Satuan Pendidikan &amp; Struktur Tingkat Kelas
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label
                  className={`p-3.5 rounded-xl border-2 flex items-center gap-3 cursor-pointer transition-all ${
                    (schoolForm.education_level || 'SMA') === 'SMP'
                      ? 'border-indigo-600 bg-indigo-50/60 text-indigo-950 font-bold'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="educationLevel"
                    checked={(schoolForm.education_level || 'SMA') === 'SMP'}
                    onChange={() => setSchoolForm({ ...schoolForm, education_level: 'SMP' })}
                    className="accent-indigo-600"
                  />
                  <div>
                    <div className="text-xs font-extrabold">Tingkat SMP / MTs</div>
                    <div className="text-[11px] text-slate-500 font-normal">
                      Tingkat VII (Kelas 7), VIII (Kelas 8), dan IX (Kelas 9)
                    </div>
                  </div>
                </label>

                <label
                  className={`p-3.5 rounded-xl border-2 flex items-center gap-3 cursor-pointer transition-all ${
                    (schoolForm.education_level || 'SMA') === 'SMA'
                      ? 'border-indigo-600 bg-indigo-50/60 text-indigo-950 font-bold'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <input
                    type="radio"
                    name="educationLevel"
                    checked={(schoolForm.education_level || 'SMA') === 'SMA'}
                    onChange={() => setSchoolForm({ ...schoolForm, education_level: 'SMA' })}
                    className="accent-indigo-600"
                  />
                  <div>
                    <div className="text-xs font-extrabold">Tingkat SMA / SMK / MA</div>
                    <div className="text-[11px] text-slate-500 font-normal">
                      Tingkat X (Kelas 10), XI (Kelas 11), dan XII (Kelas 12)
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Menu Input Logo Sekolah & Logo Pemda (Untuk Kop Surat Dokumen) */}
            <div className="pt-3 pb-2 border-t border-slate-100">
              <div className="mb-3">
                <label className="block font-bold text-slate-800 text-xs">
                  Logo Resmi Satuan Pendidikan &amp; Pemerintah Daerah
                </label>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Kedua logo ini akan dicetak secara simetris pada Kop Surat resmi dokumen Berita Acara (BAHP) dan Surat Keputusan (SK) Kepanitiaan.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Logo Pemerintah Daerah (Sisi Kiri Kop) */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <span>1. Logo Pemda / Kemenag</span>
                      <span className="text-[10px] text-slate-500 font-normal">(Kiri Kop Surat)</span>
                    </span>
                    {schoolForm.pemda_logo_url && (
                      <button
                        type="button"
                        onClick={() => setSchoolForm({ ...schoolForm, pemda_logo_url: '' })}
                        className="text-[10px] text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                      >
                        Hapus Logo
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-xl border border-slate-300 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                      {schoolForm.pemda_logo_url ? (
                        <img
                          src={schoolForm.pemda_logo_url}
                          alt="Pratinjau Logo Pemda"
                          referrerPolicy="no-referrer"
                          className="max-h-14 max-w-14 object-contain"
                        />
                      ) : (
                        <div className="text-[10px] text-slate-400 font-medium text-center px-1">
                          Belum Ada Logo
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer shadow-2xs transition-colors">
                        <Upload className="w-3.5 h-3.5 text-slate-500" />
                        <span>Pilih Berkas Logo Pemda</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePemdaLogoUpload}
                          className="hidden"
                        />
                      </label>
                      <input
                        type="url"
                        value={schoolForm.pemda_logo_url || ''}
                        onChange={(e) => setSchoolForm({ ...schoolForm, pemda_logo_url: e.target.value })}
                        placeholder="Atau tautan URL logo pemda..."
                        className="w-full p-2 rounded-lg border border-slate-300 font-mono text-[11px] bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Logo Pemprov / Dinas Pendidikan / Kemenag Kabupaten / Kota.
                  </p>
                </div>

                {/* 2. Logo Sekolah / Madrasah (Sisi Kanan Kop) */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <span>2. Logo Satuan Pendidikan</span>
                      <span className="text-[10px] text-slate-500 font-normal">(Kanan Kop Surat)</span>
                    </span>
                    {schoolForm.logo_url && (
                      <button
                        type="button"
                        onClick={() => setSchoolForm({ ...schoolForm, logo_url: '' })}
                        className="text-[10px] text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                      >
                        Hapus Logo
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-xl border border-slate-300 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                      {schoolForm.logo_url ? (
                        <img
                          src={schoolForm.logo_url}
                          alt="Pratinjau Logo Sekolah"
                          referrerPolicy="no-referrer"
                          className="max-h-14 max-w-14 object-contain"
                        />
                      ) : (
                        <div className="text-[10px] text-slate-400 font-medium text-center px-1">
                          Belum Ada Logo
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer shadow-2xs transition-colors">
                        <Upload className="w-3.5 h-3.5 text-slate-500" />
                        <span>Pilih Berkas Logo Sekolah</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleSchoolLogoUpload}
                          className="hidden"
                        />
                      </label>
                      <input
                        type="url"
                        value={schoolForm.logo_url || ''}
                        onChange={(e) => setSchoolForm({ ...schoolForm, logo_url: e.target.value })}
                        placeholder="Atau tautan URL logo sekolah..."
                        className="w-full p-2 rounded-lg border border-slate-300 font-mono text-[11px] bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight">
                    Logo resmi lambang almamater sekolah atau madrasah.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Alamat Lengkap Satuan Pendidikan
              </label>
              <input
                type="text"
                value={schoolForm.address}
                onChange={(e) => setSchoolForm({ ...schoolForm, address: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-300"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Kepala Sekolah / Madrasah (Lengkap Gelar)
                </label>
                <input
                  type="text"
                  value={schoolForm.principal_name}
                  onChange={(e) => setSchoolForm({ ...schoolForm, principal_name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  NIP Kepala Sekolah
                </label>
                <input
                  type="text"
                  value={schoolForm.principal_nip}
                  onChange={(e) => setSchoolForm({ ...schoolForm, principal_nip: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono"
                  required
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                Simpan Konfigurasi Sekolah
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: MANAJEMEN PERIODE PEMILIHAN (MULTI-PERIOD REUSABLE SYSTEM) */}
      {activeTab === 'periode' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Riwayat &amp; Master Periode Pemilihan (Multi-Period)
              </h3>
              <p className="text-xs text-slate-500">
                Aturan Utama: <strong>Hanya ada 1 (satu) periode berstatus AKTIF</strong> dalam satu waktu.
              </p>
            </div>

            <button
              onClick={handleOpenAddPeriod}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Periode Baru</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {periods.map((p) => {
              const isActive = p.status === 'aktif';
              return (
                <div
                  key={p.id}
                  className={`bg-white rounded-2xl border p-5 shadow-xs transition-all ${
                    isActive
                      ? 'border-emerald-500 ring-2 ring-emerald-100'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-extrabold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                          {p.academic_year}
                        </span>
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            STATUS: AKTIF
                          </span>
                        ) : p.status === 'selesai' ? (
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                            SELESAI (ARSIP)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                            DRAFT / PERSIAPAN
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 mt-1.5">
                        {p.period_name}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditPeriod(p)}
                        title="Edit Data Periode"
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeletePeriod(p)}
                        title="Hapus Periode"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-slate-500 space-y-1 my-3 bg-slate-50 p-3 rounded-xl">
                    <div className="flex justify-between">
                      <span>Waktu Mulai:</span>
                      <span className="font-mono text-slate-700">
                        {new Date(p.start_date).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Waktu Selesai:</span>
                      <span className="font-mono text-slate-700">
                        {new Date(p.end_date).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400">
                      ID: <span className="font-mono">{p.id}</span>
                    </span>

                    <div className="flex items-center gap-2">
                      {!isActive && (
                        <button
                          onClick={() => handleActivatePeriod(p)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer"
                        >
                          Aktifkan Periode Ini
                        </button>
                      )}
                      {isActive && (
                        <button
                          onClick={() => {
                            if (confirm('Tutup dan selesaikan pemungutan suara untuk periode ini?')) {
                              db.updatePeriodStatus(p.id, 'selesai');
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs transition-colors cursor-pointer"
                        >
                          Tutup Pemungutan Suara
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: MANAJEMEN PANITIA & SK */}
      {activeTab === 'panitia' && (() => {
        const activeSk = db.getSKConfig(activePeriod?.id);
        const formattedDate = (() => {
          try {
            if (!activeSk.sk_date) return '-';
            const d = new Date(activeSk.sk_date);
            if (isNaN(d.getTime())) return activeSk.sk_date;
            return d.toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            });
          } catch {
            return activeSk.sk_date;
          }
        })();

        return (
          <div className="space-y-4">
            {skSaveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Konfigurasi Surat Keputusan (SK) Kepanitiaan berhasil diperbarui dan disinkronkan ke seluruh panitia serta Berita Acara (BAHP)!</span>
              </div>
            )}

            {skDownloadedNotice && (
              <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Dokumen Surat Keputusan (SK) Kepanitiaan berhasil diunduh! Dokumen siap dicetak atau disimpan sebagai arsip PDF.</span>
              </div>
            )}

            {/* Section Banner SK Legalitas (Sesuai Format Menu BAHP) */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-bold border border-indigo-400/30 uppercase mb-2">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Legalitas Kepanitiaan &amp; Dasar Hukum
                </div>
                <h3 className="text-lg sm:text-xl font-black">
                  Surat Keputusan (SK) Kepanitiaan
                </h3>
                <p className="text-xs text-indigo-200 mt-1 max-w-xl">
                  Dokumen resmi penetapan dan pengangkatan Panitia Pelaksana Pemilihan {school.type} oleh Kepala {school.type === 'OSIM' ? 'Madrasah' : 'Sekolah'}, lengkap dengan kop dinas, konsideran hukum, diktum ketetapan, dan lampiran susunan panitia.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap self-start md:self-auto shrink-0">
                <button
                  id="btn-view-sk-doc"
                  onClick={() => setIsSkPrintMode(true)}
                  className="px-5 py-2.5 bg-white hover:bg-indigo-50 text-slate-900 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-indigo-700" />
                  <span>Lihat Dokumen SK</span>
                </button>

                <button
                  id="btn-edit-sk-config"
                  onClick={handleOpenSkModal}
                  className="px-4 py-2.5 bg-indigo-800/80 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl border border-indigo-500/40 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-indigo-300" />
                  <span>Edit Data SK</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Susunan Anggota Panitia Pemilihan
                </h3>
                <p className="text-xs text-slate-500">
                  Daftar personalia panitia yang bertugas pada periode aktif ini beserta hak akses portalnya.
                </p>
              </div>

              <button
                id="btn-add-committee-member"
                onClick={handleOpenAddCommittee}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Anggota Panitia</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex flex-wrap items-center gap-6">
                  <div>
                    <span className="font-bold text-slate-500 block text-[10px] uppercase tracking-wider">
                      Nomor SK Kepanitiaan
                    </span>
                    <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded-md border border-slate-300 inline-block mt-0.5">
                      {activeSk.sk_number}
                    </span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 block text-[10px] uppercase tracking-wider">
                      Tanggal Pengesahan
                    </span>
                    <span className="text-slate-900 font-semibold inline-block mt-0.5">
                      {formattedDate}
                    </span>
                  </div>
                  {activeSk.sk_file_name && (
                    <div>
                      <span className="font-bold text-slate-500 block text-[10px] uppercase tracking-wider">
                        Dokumen Lampiran
                      </span>
                      <span className="text-slate-700 font-mono text-[11px] bg-white px-2.5 py-1 rounded-md border border-slate-200 inline-block mt-0.5">
                        {activeSk.sk_file_name}
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-slate-500 text-[11px] font-medium">
                  Status Legalitas: <span className="text-emerald-700 font-bold">Sah Terdaftar</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Jabatan Panitia</th>
                      <th className="px-4 py-3">Nama Anggota</th>
                      <th className="px-4 py-3">Email Akun Login</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {committees
                      .slice((committeePage - 1) * committeePageSize, committeePage * committeePageSize)
                      .map((com) => (
                      <tr key={com.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3">
                          <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                            {com.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {com.member_name}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600">{com.email}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {com.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEditCommittee(com)}
                              title="Edit Data Panitia"
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCommittee(com)}
                              title="Hapus Anggota"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {committees.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                          Belum ada anggota kepanitiaan yang didaftarkan.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <Pagination
                currentPage={committeePage}
                totalItems={committees.length}
                pageSize={committeePageSize}
                onPageChange={(p) => setCommitteePage(p)}
                onPageSizeChange={(s) => {
                  setCommitteePageSize(s);
                  setCommitteePage(1);
                }}
                itemName="anggota panitia"
              />
            </div>
          </div>
        );
      })()}

      {/* TAB 4: AUDIT LOGS & BERITA ACARA HASIL PEMILIHAN (BAHP) */}
      {activeTab === 'audit_bahp' && (
        <div className="space-y-6">
          {/* Section Pengesahan BAHP */}
          <div className="bg-gradient-to-br from-blue-900 to-indigo-950 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-bold border border-blue-400/30 uppercase mb-2">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Dokumen Hukum Resmi Sekolah
              </div>
              <h3 className="text-lg sm:text-xl font-black">
                Berita Acara Hasil Pemilihan (BAHP)
              </h3>
              <p className="text-xs text-blue-200 mt-1 max-w-xl">
                Dokumen resmi berita acara rekapitulasi perolehan suara bertandatangan digital Kepala Sekolah dan Ketua Panitia,
                lengkap dengan kop surat resmi untuk arsip dinas pendidikan / kemenag.
              </p>
            </div>

            <button
              onClick={() => setIsBahpPrintMode(true)}
              className="px-5 py-3 bg-white hover:bg-blue-50 text-slate-900 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto shrink-0"
            >
              <Printer className="w-4 h-4 text-blue-700" />
              <span>Lihat &amp; Cetak Berita Acara (BAHP)</span>
            </button>
          </div>

          {/* Section Audit Trail Logs */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-slate-900">
                  Audit Trails &amp; Log Aktivitas Keamanan
                </h4>
                <p className="text-xs text-slate-500">
                  Pencatatan real-time seluruh mutasi data demi menjamin transparansi nir-kecurangan (tamper-proof)
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Waktu Log</th>
                    <th className="px-4 py-3">Aktor / Peran</th>
                    <th className="px-4 py-3">Aksi Sistem</th>
                    <th className="px-4 py-3">Rincian Transaksi</th>
                    <th className="px-4 py-3 font-mono">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 font-mono text-[11px]">
                  {auditLogs
                    .slice((auditPage - 1) * auditPageSize, auditPage * auditPageSize)
                    .map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-2.5 text-slate-500">
                        {new Date(log.timestamp).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-2.5 font-sans font-semibold text-slate-900">
                        {log.user_role}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="px-2 py-0.5 rounded-sm bg-slate-100 font-bold text-slate-800">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 font-sans text-slate-700">{log.details}</td>
                      <td className="px-4 py-2.5 text-slate-400">{log.ip_address}</td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-400 font-sans">
                        Belum ada aktivitas audit log yang tercatat.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={auditPage}
              totalItems={auditLogs.length}
              pageSize={auditPageSize}
              onPageChange={(p) => setAuditPage(p)}
              onPageSizeChange={(s) => {
                setAuditPageSize(s);
                setAuditPage(1);
              }}
              itemName="catatan audit"
            />
          </div>
        </div>
      )}

      {/* TAB 5: MANAJEMEN PENGGUNA (TAMBAH USER / CRUD) */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* User Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Total Akun Pengguna</p>
                <h4 className="text-2xl font-black text-slate-900 mt-1">{users.length}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Admin &amp; Panitia terdaftar</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Admin Sekolah</p>
                <h4 className="text-2xl font-black text-slate-900 mt-1">
                  {users.filter((u) => u.role === 'admin').length}
                </h4>
                <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Hak akses penuh</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Panitia Pemilihan</p>
                <h4 className="text-2xl font-black text-slate-900 mt-1">
                  {users.filter((u) => u.role === 'panitia').length}
                </h4>
                <p className="text-[11px] text-purple-600 font-medium mt-0.5">KPPS / Operator</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <User className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* User Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Daftar Pengguna Portal (CRUD User)</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                    {users.length} Akun
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kelola otentikasi login, kata sandi, dan perizinan hak akses untuk Administrator dan Panitia.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-full sm:w-56">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari user atau nama..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  onClick={handleOpenAddUser}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Tambah User Baru</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">No</th>
                    <th className="px-4 py-3">Username / Akun</th>
                    <th className="px-4 py-3">Nama Lengkap</th>
                    <th className="px-4 py-3">Role / Peran</th>
                    <th className="px-4 py-3 text-center">Status</th>
                    <th className="px-4 py-3">Tanggal Dibuat</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {users
                    .filter(
                      (u) =>
                        u.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                        u.name.toLowerCase().includes(userSearchQuery.toLowerCase())
                    )
                    .slice((userPage - 1) * userPageSize, userPage * userPageSize)
                    .map((user, idx) => {
                      const isAdmin = user.role === 'admin';
                      return (
                        <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3 text-slate-400 font-mono">
                            {(userPage - 1) * userPageSize + idx + 1}
                          </td>
                          <td className="px-4 py-3 font-mono font-bold text-slate-900">
                            @{user.username}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-800">{user.name}</td>
                          <td className="px-4 py-3">
                            {isAdmin ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                                <ShieldCheck className="w-3 h-3 text-amber-600" />
                                Admin Sekolah
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-purple-50 text-purple-900 border border-purple-200">
                                <User className="w-3 h-3 text-purple-600" />
                                Panitia Pemilihan
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {user.status === 'aktif' ? (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                AKTIF
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                                NONAKTIF
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">
                            {user.created_at
                              ? new Date(user.created_at).toLocaleDateString('id-ID', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : '-'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleEditUser(user)}
                                title="Edit Pengguna"
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user)}
                                title="Hapus Pengguna"
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  {users.filter(
                    (u) =>
                      u.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                      u.name.toLowerCase().includes(userSearchQuery.toLowerCase())
                  ).length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                        Tidak ada pengguna yang cocok dengan pencarian &quot;{userSearchQuery}&quot;.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={userPage}
              totalItems={
                users.filter(
                  (u) =>
                    u.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                    u.name.toLowerCase().includes(userSearchQuery.toLowerCase())
                ).length
              }
              pageSize={userPageSize}
              onPageChange={(p) => setUserPage(p)}
              onPageSizeChange={(s) => {
                setUserPageSize(s);
                setUserPage(1);
              }}
              itemName="pengguna"
            />
          </div>
        </div>
      )}

      {/* TAB 6: GANTI PASSWORD USER */}
      {activeTab === 'password' && (
        <ChangePasswordView
          user={authUser || { name: school.principal_name, email: 'admin@sman1teladan.sch.id', role: 'admin' }}
          userRoleLabel="Administrator Satuan Pendidikan"
        />
      )}

      {/* TAB 7: INTEGRASI SUPABASE */}
      {activeTab === 'supabase' && <SupabaseSettings />}

      {/* Modal New / Edit Period */}
      {isPeriodModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingPeriod ? 'Edit Periode Pemilihan' : 'Buat Periode Pemilihan Baru'}
              </h3>
              <button
                onClick={() => setIsPeriodModalOpen(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePeriod} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Periode Pemilihan
                </label>
                <input
                  type="text"
                  value={periodForm.period_name}
                  onChange={(e) => setPeriodForm({ ...periodForm, period_name: e.target.value })}
                  placeholder="Contoh: Pemilihan Ketua OSIS 2027/2028"
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tahun Ajaran</label>
                <input
                  type="text"
                  value={periodForm.academic_year}
                  onChange={(e) => setPeriodForm({ ...periodForm, academic_year: e.target.value })}
                  placeholder="2027/2028"
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Waktu Mulai</label>
                  <input
                    type="datetime-local"
                    value={periodForm.start_date}
                    onChange={(e) => setPeriodForm({ ...periodForm, start_date: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 text-xs font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Waktu Selesai</label>
                  <input
                    type="datetime-local"
                    value={periodForm.end_date}
                    onChange={(e) => setPeriodForm({ ...periodForm, end_date: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300 text-xs font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Status Periode</label>
                <select
                  value={periodForm.status}
                  onChange={(e) => setPeriodForm({ ...periodForm, status: e.target.value as any })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="draft">Draft (Persiapan / Belum Dibuka)</option>
                  <option value="aktif">Aktif (Buka Pemungutan Suara)</option>
                  <option value="selesai">Selesai (Arsip Pemilihan)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPeriodModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  {editingPeriod ? 'Simpan Perubahan' : 'Buat Periode'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Committee */}
      {isCommitteeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingCommittee ? 'Edit Anggota Panitia' : 'Tambah Anggota Panitia (Berdasarkan SK)'}
              </h3>
              <button
                onClick={() => setIsCommitteeModalOpen(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCommittee} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Jabatan Panitia</label>
                <select
                  value={committeeForm.role}
                  onChange={(e) => setCommitteeForm({ ...committeeForm, role: e.target.value as any })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="Ketua Panitia">Ketua Panitia</option>
                  <option value="Sekretaris">Sekretaris</option>
                  <option value="Bendahara">Bendahara</option>
                  <option value="Seksi Bilik Suara">Seksi Bilik Suara</option>
                  <option value="Seksi Teknis IT">Seksi Teknis IT</option>
                  <option value="Anggota">Anggota</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={committeeForm.member_name}
                  onChange={(e) => setCommitteeForm({ ...committeeForm, member_name: e.target.value })}
                  placeholder="Nama pengurus/guru/siswa panitia"
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email / Akun Login</label>
                <input
                  type="email"
                  value={committeeForm.email}
                  onChange={(e) => setCommitteeForm({ ...committeeForm, email: e.target.value })}
                  placeholder="panitia@sekolah.sch.id"
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-mono"
                  required
                />
              </div>

              {editingCommittee && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Keanggotaan</label>
                  <select
                    value={committeeForm.status}
                    onChange={(e) => setCommitteeForm({ ...committeeForm, status: e.target.value as any })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCommitteeModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 cursor-pointer"
                >
                  {editingCommittee ? 'Simpan Perubahan' : 'Simpan Panitia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit / Konfigurasi SK Kepanitiaan */}
      {isSkModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">
                  Konfigurasi Surat Keputusan (SK) Kepanitiaan
                </h3>
              </div>
              <button
                onClick={() => setIsSkModalOpen(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSkConfig} className="p-6 space-y-4 text-xs">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-blue-900 leading-relaxed">
                <p className="font-bold text-xs text-blue-950 mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-blue-600 inline" />
                  Legalitas Surat Keputusan Pemilihan
                </p>
                <p className="text-[11px] text-blue-800">
                  Nomor dan tanggal pengesahan SK diterbitkan oleh Kepala Sekolah/Madrasah. Nilai ini akan otomatis disinkronkan ke seluruh data anggota panitia dan naskah resmi <strong>Berita Acara Hasil Pemilihan (BAHP)</strong>.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nomor Surat Keputusan (SK) Resmi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={skConfigForm.sk_number}
                  onChange={(e) => setSkConfigForm({ ...skConfigForm, sk_number: e.target.value })}
                  placeholder="Contoh: 421.3/089/SMAN1/IX/2026"
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Nomor register dinas surat keputusan pengangkatan panitia.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tanggal Pengesahan SK <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  value={skConfigForm.sk_date}
                  onChange={(e) => setSkConfigForm({ ...skConfigForm, sk_date: e.target.value })}
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Berkas Dokumen SK (PDF / Word / Gambar)
                </label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 cursor-pointer flex items-center gap-1.5 font-semibold text-xs transition-colors shrink-0">
                      <Upload className="w-3.5 h-3.5 text-slate-600" />
                      <span>Pilih Berkas Lampiran</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                        onChange={handleSkFileUpload}
                        className="hidden"
                      />
                    </label>
                    <input
                      type="text"
                      value={skConfigForm.sk_file_name}
                      onChange={(e) => setSkConfigForm({ ...skConfigForm, sk_file_name: e.target.value })}
                      placeholder="SK_Kepanitiaan_Resmi.pdf"
                      className="flex-1 p-2 rounded-lg border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                    />
                  </div>
                  {skConfigForm.sk_file_data && (
                    <div className="flex items-center justify-between p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-[11px]">
                      <span className="truncate">Berkas kustom terlampir ({skConfigForm.sk_file_name})</span>
                      <button
                        type="button"
                        onClick={() => setSkConfigForm({ ...skConfigForm, sk_file_data: undefined, sk_file_name: 'SK_Kepanitiaan_Resmi.html' })}
                        className="text-rose-600 hover:text-rose-800 font-bold ml-2 cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
                  )}
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Anda dapat mengunggah berkas scan SK sekolah, atau biarkan sistem membuat format resmi standar siap cetak secara otomatis.
                </span>
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-slate-100 gap-2">
                <button
                  type="button"
                  onClick={() => setIsSkModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer transition-colors shadow-xs text-xs"
                >
                  Simpan Konfigurasi SK
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add / Edit User (CRUD User) */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-sm">
                  {editingUser ? 'Edit Akun Pengguna' : 'Tambah User Pengguna Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Username Login <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  placeholder="Contoh: panitia_bilik1 atau admin2"
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-mono"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Digunakan sebagai ID saat login di Form Otentikasi.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap Pengguna <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="Contoh: Muhammad Rizki, S.Pd"
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Kata Sandi (Password) {!editingUser && <span className="text-rose-500">*</span>}
                </label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  placeholder={editingUser ? 'Kosongkan jika tidak ingin mengubah password' : 'Kata sandi akun'}
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                  required={!editingUser}
                />
                {editingUser && (
                  <p className="text-[10px] text-slate-400 mt-1">
                    Biarkan kosong jika tetap menggunakan kata sandi saat ini.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Role / Peran <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value as AppUserRole })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium"
                  >
                    <option value="panitia">Panitia Pemilihan</option>
                    <option value="admin">Admin Sekolah</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Akun</label>
                  <select
                    value={userForm.status}
                    onChange={(e) => setUserForm({ ...userForm, status: e.target.value as any })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white font-medium"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer"
                >
                  {editingUser ? 'Simpan Perubahan' : 'Tambah Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Delete Operations */}
      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal((prev) => ({ ...prev, isOpen: false, errorMessage: null }))}
        onConfirm={handleConfirmDelete}
        title={
          deleteModal.type === 'period'
            ? 'Hapus Periode Pemilihan'
            : deleteModal.type === 'committee'
            ? 'Hapus Anggota Panitia'
            : 'Hapus Akun Pengguna'
        }
        itemName={deleteModal.name}
        warningDetails={deleteModal.warningDetails}
        errorMessage={deleteModal.errorMessage}
      />
    </div>
  );
};
