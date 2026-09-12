import React, { useState, useEffect } from 'react';
import { School, ElectionPeriod, Candidate, Voter, PanitiaTab, AuthUser } from '../../types';
import { db, realtimeBus } from '../../lib/storage';
import { exportDptToCsv, downloadDptTemplate, parseDptCsv } from '../../lib/exportUtils';
import {
  Users,
  Award,
  KeyRound,
  FileSpreadsheet,
  Plus,
  Trash2,
  Edit,
  RotateCcw,
  Search,
  Printer,
  Download,
  Upload,
  CheckCircle2,
  Clock,
  RefreshCw,
  X,
  LogOut,
} from 'lucide-react';
import { PrintableTokenCards } from '../print/PrintableTokenCards';
import { Pagination } from '../common/Pagination';
import { ConfirmDeleteModal } from '../common/ConfirmDeleteModal';
import { ChangePasswordView } from '../common/ChangePasswordView';

interface PanitiaDashboardProps {
  school: School;
  activePeriod: ElectionPeriod | null;
  activeTab?: PanitiaTab;
  onTabChange?: (tab: PanitiaTab) => void;
  authUser?: AuthUser | null;
  onLogout?: () => void;
}

export const PanitiaDashboard: React.FC<PanitiaDashboardProps> = ({
  school,
  activePeriod,
  activeTab: propTab,
  onTabChange,
  authUser,
  onLogout,
}) => {
  const [internalTab, setInternalTab] = useState<PanitiaTab>('dpt');
  const activeTab = propTab || internalTab;

  const handleTabSelect = (tab: PanitiaTab) => {
    setInternalTab(tab);
    if (onTabChange) onTabChange(tab);
  };

  // Periode Pemilihan Dinamis (Sinkron dengan Menu Admin & Real-time)
  const [periods, setPeriods] = useState<ElectionPeriod[]>(() => db.getPeriods());
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(
    () => activePeriod?.id || db.getActivePeriod()?.id || ''
  );

  useEffect(() => {
    if (activePeriod?.id) {
      setSelectedPeriodId(activePeriod.id);
    }
  }, [activePeriod?.id]);

  useEffect(() => {
    const handlePeriods = () => {
      const list = db.getPeriods();
      setPeriods(list);
      const active = db.getActivePeriod();
      if (active && (!selectedPeriodId || !list.some((p) => p.id === selectedPeriodId))) {
        setSelectedPeriodId(active.id);
      }
    };
    realtimeBus.addEventListener('periods_updated', handlePeriods);
    return () => realtimeBus.removeEventListener('periods_updated', handlePeriods);
  }, [selectedPeriodId]);

  const currentPeriod = periods.find((p) => p.id === selectedPeriodId) || activePeriod || periods[0] || null;

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
  const [isPrintMode, setIsPrintMode] = useState(false);

  // Delete Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    type: 'voter' | 'candidate';
    item: any;
    name: string;
    warningDetails?: string;
  }>({
    isOpen: false,
    type: 'voter',
    item: null,
    name: '',
  });

  // Pagination state for DPT
  const [dptPage, setDptPage] = useState(1);
  const [dptPageSize, setDptPageSize] = useState(15);

  useEffect(() => {
    setDptPage(1);
  }, [searchQuery, selectedClassFilter]);

  // Modal State for Candidate Add/Edit
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [candForm, setCandForm] = useState({
    ballot_number: 1,
    chairman_name: '',
    vice_chairman_name: '',
    chairman_class: '',
    vice_chairman_class: '',
    photo_url: '',
    vision: '',
    mission: '',
    programs: '',
    video_url: '',
  });

  // Manual Add & Edit Voter State
  const [isVoterModalOpen, setIsVoterModalOpen] = useState(false);
  const [editingVoter, setEditingVoter] = useState<Voter | null>(null);
  const [voterForm, setVoterForm] = useState({
    nisn: '',
    full_name: '',
    class_name: '',
    gender: 'L' as 'L' | 'P',
  });

  const handleOpenAddVoter = () => {
    setEditingVoter(null);
    setVoterForm({ nisn: '', full_name: '', class_name: '', gender: 'L' });
    setIsVoterModalOpen(true);
  };

  const handleEditVoter = (voter: Voter) => {
    setEditingVoter(voter);
    setVoterForm({
      nisn: voter.nisn,
      full_name: voter.full_name,
      class_name: voter.class_name,
      gender: voter.gender,
    });
    setIsVoterModalOpen(true);
  };

  const loadData = () => {
    if (!currentPeriod) return;
    setCandidates(db.getCandidates(currentPeriod.id));
    setVoters(db.getVoters(currentPeriod.id));
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    realtimeBus.addEventListener('candidates_updated', handleUpdate);
    realtimeBus.addEventListener('voters_updated', handleUpdate);
    realtimeBus.addEventListener('vote_casted', handleUpdate);
    realtimeBus.addEventListener('data_reset', handleUpdate);

    return () => {
      realtimeBus.removeEventListener('candidates_updated', handleUpdate);
      realtimeBus.removeEventListener('voters_updated', handleUpdate);
      realtimeBus.removeEventListener('vote_casted', handleUpdate);
      realtimeBus.removeEventListener('data_reset', handleUpdate);
    };
  }, [currentPeriod?.id]);

  // Handle Candidate Form Submit
  const handleSaveCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPeriod) return;

    const missionArr = candForm.mission
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const programsArr = candForm.programs
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    db.saveCandidate(
      {
        election_period_id: currentPeriod.id,
        ballot_number: Number(candForm.ballot_number),
        chairman_name: candForm.chairman_name,
        vice_chairman_name: candForm.vice_chairman_name,
        chairman_class: candForm.chairman_class,
        vice_chairman_class: candForm.vice_chairman_class,
        photo_url:
          candForm.photo_url ||
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
        vision: candForm.vision,
        mission: missionArr.length ? missionArr : ['Membangun OSIS yang aktif dan berintegritas.'],
        programs: programsArr.length ? programsArr : ['Pekan Kreativitas Siswa'],
        video_url: candForm.video_url,
      },
      editingCandidate?.id
    );

    setIsCandidateModalOpen(false);
    setEditingCandidate(null);
  };

  const handleEditCandidate = (cand: Candidate) => {
    setEditingCandidate(cand);
    setCandForm({
      ballot_number: cand.ballot_number,
      chairman_name: cand.chairman_name,
      vice_chairman_name: cand.vice_chairman_name,
      chairman_class: cand.chairman_class,
      vice_chairman_class: cand.vice_chairman_class,
      photo_url: cand.photo_url,
      vision: cand.vision,
      mission: cand.mission.join('\n'),
      programs: cand.programs.join('\n'),
      video_url: cand.video_url || '',
    });
    setIsCandidateModalOpen(true);
  };

  const handleDeleteCandidate = (cand: Candidate) => {
    setDeleteModal({
      isOpen: true,
      type: 'candidate',
      item: cand,
      name: `Paslon No. 0${cand.ballot_number} (${cand.chairman_name} & ${cand.vice_chairman_name})`,
      warningDetails: 'Data pasangan calon dan seluruh riwayat perolehan suaranya akan dihapus permanen.',
    });
  };

  const handleDeleteVoter = (voter: Voter) => {
    setDeleteModal({
      isOpen: true,
      type: 'voter',
      item: voter,
      name: `${voter.full_name} (${voter.nisn}) - Kelas ${voter.class_name}`,
      warningDetails: voter.has_voted
        ? 'Perhatian: Siswa ini telah berpartisipasi memberikan suara.'
        : 'Data pemilih dan token PIN rahasia akan dihapus dari Daftar Pemilih Tetap.',
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteModal.item) return;

    if (deleteModal.type === 'voter') {
      db.deleteVoter(deleteModal.item.id);
      loadData();
    } else if (deleteModal.type === 'candidate') {
      db.deleteCandidate(deleteModal.item.id);
      loadData();
    }

    setDeleteModal({ isOpen: false, type: 'voter', item: null, name: '' });
  };

  // Handle Add Single Voter
  const handleSaveVoter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPeriod) return;
    if (voterForm.nisn.length !== 10) {
      alert('NISN harus tepat 10 digit numerik!');
      return;
    }

    if (editingVoter) {
      db.updateVoter(editingVoter.id, {
        nisn: voterForm.nisn.trim(),
        full_name: voterForm.full_name.trim(),
        class_name: voterForm.class_name.trim(),
        gender: voterForm.gender,
      });
    } else {
      db.addSingleVoter({
        election_period_id: currentPeriod.id,
        nisn: voterForm.nisn.trim(),
        full_name: voterForm.full_name.trim(),
        class_name: voterForm.class_name.trim(),
        gender: voterForm.gender,
      });
    }

    setIsVoterModalOpen(false);
    setEditingVoter(null);
    setVoterForm({ nisn: '', full_name: '', class_name: '', gender: 'L' });
  };

  // Handle CSV File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentPeriod || !e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const parsed = parseDptCsv(content);
        if (parsed.length === 0) {
          alert('Format berkas CSV tidak valid atau kosong. Silakan gunakan template resmi.');
          return;
        }
        const importedCount = db.importVoters(currentPeriod.id, parsed);
        alert(`Berhasil mengimpor ${importedCount} data siswa ke DPT!`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Reset PIN Voter
  const handleResetPin = (voter: Voter) => {
    if (voter.has_voted) {
      alert('Tidak dapat mereset PIN pemilih yang sudah menggunakan hak suaranya!');
      return;
    }
    if (confirm(`Reset PIN untuk ${voter.full_name} (${voter.nisn})? Token PIN baru akan dibuat secara acak.`)) {
      const newPin = db.resetVoterPin(voter.id);
      alert(`PIN baru untuk ${voter.full_name} adalah: ${newPin}`);
    }
  };

  // Bulk Regenerate PINs
  const handleBulkRegenerate = () => {
    if (!currentPeriod) return;
    if (
      confirm(
        'Generate ulang token PIN untuk seluruh pemilih yang BELUM memilih? Seluruh kartu cetak yang lama harus diganti dengan kartu baru!'
      )
    ) {
      const count = db.regenerateAllPins(currentPeriod.id);
      alert(`Berhasil membuat ulang ${count} token PIN pemilih.`);
    }
  };

  // Filter Voters & Tingkat Detection
  const classesList: string[] = Array.from(new Set<string>(voters.map((v) => v.class_name))).sort();

  // Deteksi jenjang sekolah: baik dari konfigurasi profil sekolah atau auto-detect dari nama-nama kelas DPT
  const hasSmpClass = classesList.some((cls: string) => {
    const clean = cls.trim().toUpperCase();
    return /^(VII|VIII|IX|7|8|9)(\b|[\s\-_A-Z0-9])/i.test(clean);
  });
  const hasSmaClass = classesList.some((cls: string) => {
    const clean = cls.trim().toUpperCase();
    return /^(X|XI|XII|10|11|12)(\b|[\s\-_A-Z0-9])/i.test(clean);
  });

  const isSmp = school.education_level === 'SMP' || (hasSmpClass && !hasSmaClass);

  // Helper matching tingkat
  const matchLevel = (className: string, filterKey: string): boolean => {
    const clean = className.trim().toUpperCase();
    if (filterKey === 'TINGKAT_7' || filterKey === 'TINGKAT_VII') {
      return /^(VII\b|7\b|VII[\s\-_]|7[\s\-_A-Z])/i.test(clean);
    }
    if (filterKey === 'TINGKAT_8' || filterKey === 'TINGKAT_VIII') {
      return /^(VIII\b|8\b|VIII[\s\-_]|8[\s\-_A-Z])/i.test(clean);
    }
    if (filterKey === 'TINGKAT_9' || filterKey === 'TINGKAT_IX') {
      return /^(IX\b|9\b|IX[\s\-_]|9[\s\-_A-Z])/i.test(clean);
    }
    if (filterKey === 'TINGKAT_10' || filterKey === 'TINGKAT_X') {
      return /^(X\b|10\b|X[\s\-_]|10[\s\-_A-Z])/i.test(clean);
    }
    if (filterKey === 'TINGKAT_11' || filterKey === 'TINGKAT_XI') {
      return /^(XI\b|11\b|XI[\s\-_]|11[\s\-_A-Z])/i.test(clean);
    }
    if (filterKey === 'TINGKAT_12' || filterKey === 'TINGKAT_XII') {
      return /^(XII\b|12\b|XII[\s\-_]|12[\s\-_A-Z])/i.test(clean);
    }
    return false;
  };

  const filteredVoters = voters.filter((v) => {
    const matchQuery =
      v.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.nisn.includes(searchQuery);
    const matchClass =
      selectedClassFilter === 'ALL'
        ? true
        : selectedClassFilter.startsWith('TINGKAT_')
        ? matchLevel(v.class_name, selectedClassFilter)
        : v.class_name === selectedClassFilter;
    return matchQuery && matchClass;
  });

  // Jika tombol Cetak Kartu ditekan
  if (isPrintMode) {
    return (
      <PrintableTokenCards
        school={school}
        activePeriod={currentPeriod}
        voters={filteredVoters}
        onBack={() => setIsPrintMode(false)}
      />
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Panitia Section Header Banner */}
      <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-indigo-600 text-white shadow-2xs">
              Portal Operasional &bull; Panitia Pemilihan (KPPS/MPK)
            </span>
            <span className="text-xs text-slate-400 font-medium">NPSN: {school.npsn}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Manajemen Pilketos &bull; {currentPeriod?.period_name || 'Periode Pemilihan'}
            </h2>

            {periods.length > 1 && (
              <div className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 rounded-xl border border-slate-200 transition-colors">
                <span className="text-[11px] font-bold text-slate-500">Pilih Periode:</span>
                <select
                  value={currentPeriod?.id || ''}
                  onChange={(e) => setSelectedPeriodId(e.target.value)}
                  className="text-xs font-bold text-slate-800 bg-transparent border-none outline-none cursor-pointer pr-1"
                >
                  {periods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.academic_year} &mdash; {p.period_name} ({p.status.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Kelola data pasangan calon, Daftar Pemilih Tetap (DPT), pencetakan token kartu suara siswa, dan pemantauan bilik suara secara real-time.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
          <div
            className={`px-4 py-2.5 rounded-xl text-left sm:text-right border transition-all ${
              currentPeriod?.status === 'aktif'
                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                : currentPeriod?.status === 'selesai'
                ? 'bg-slate-100 border-slate-300 text-slate-800'
                : 'bg-amber-50/80 border-amber-300 text-amber-950'
            }`}
          >
            <p
              className={`text-[10px] font-bold uppercase tracking-wider ${
                currentPeriod?.status === 'aktif'
                  ? 'text-emerald-700'
                  : currentPeriod?.status === 'selesai'
                  ? 'text-slate-600'
                  : 'text-amber-700'
              }`}
            >
              Status Pemilihan
            </p>
            <p className="text-xs font-black flex items-center sm:justify-end gap-1.5 mt-0.5">
              {currentPeriod?.status === 'aktif' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-emerald-900 font-extrabold">PEMUNGUTAN SUARA AKTIF</span>
                </>
              ) : currentPeriod?.status === 'selesai' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  <span className="text-slate-700 font-bold">SELESAI (DITUTUP)</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span className="text-amber-900 font-bold">TAHAP PERSIAPAN (DRAFT)</span>
                </>
              )}
            </p>
            <p
              className={`text-[10px] mt-0.5 hidden sm:block ${
                currentPeriod?.status === 'aktif'
                  ? 'text-emerald-700 font-medium'
                  : currentPeriod?.status === 'selesai'
                  ? 'text-slate-500 font-medium'
                  : 'text-amber-700 font-medium'
              }`}
            >
              {currentPeriod?.status === 'aktif'
                ? 'Pemungutan suara terbuka untuk siswa'
                : currentPeriod?.status === 'selesai'
                ? 'Pemungutan suara telah ditutup & diarsipkan'
                : 'Pemungutan suara belum dibuka (Mode Persiapan)'}
            </p>
          </div>
        </div>
      </div>

      {/* Panitia Full-Width Tab Navigation Bar */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-1.5 overflow-x-auto scrollbar-none">
        <button
          onClick={() => handleTabSelect('dpt')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'dpt'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-indigo-900 hover:bg-indigo-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>DPT Siswa</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'dpt' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-800'
            }`}
          >
            {voters.length}
          </span>
        </button>

        <button
          onClick={() => handleTabSelect('token')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'token'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-indigo-900 hover:bg-indigo-50'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Cetak Kartu &amp; PIN</span>
        </button>

        <button
          onClick={() => handleTabSelect('paslon')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'paslon'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-indigo-900 hover:bg-indigo-50'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Pasangan Calon</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'paslon' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-800'
            }`}
          >
            {candidates.length}
          </span>
        </button>

        <button
          onClick={() => handleTabSelect('monitoring')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'monitoring'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-indigo-900 hover:bg-indigo-50'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Monitoring Bilik</span>
        </button>

        <button
          onClick={() => handleTabSelect('password')}
          className={`ml-auto px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'password'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-indigo-900 hover:bg-indigo-50'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>Ganti Password</span>
        </button>
      </div>

      {/* TAB 1: DPT SISWA & IMPORT */}
      {activeTab === 'dpt' && (
        <div className="space-y-4">
          {/* Action Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {/* Search & Filter */}
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari Nama siswa atau NISN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Class Filter Dropdown (Dinamis: Mendukung SMP/MTs & SMA/SMK/MA) */}
              <select
                value={selectedClassFilter}
                onChange={(e) => setSelectedClassFilter(e.target.value)}
                className="py-2 px-3 rounded-xl border border-slate-300 text-xs bg-white text-slate-700 font-medium"
              >
                <option value="ALL">Semua Tingkat &amp; Kelas</option>
                {isSmp ? (
                  <>
                    <option value="TINGKAT_7">Tingkat VII / Kelas 7</option>
                    <option value="TINGKAT_8">Tingkat VIII / Kelas 8</option>
                    <option value="TINGKAT_9">Tingkat IX / Kelas 9</option>
                  </>
                ) : (
                  <>
                    <option value="TINGKAT_X">Tingkat X / Kelas 10</option>
                    <option value="TINGKAT_XI">Tingkat XI / Kelas 11</option>
                    <option value="TINGKAT_XII">Tingkat XII / Kelas 12</option>
                  </>
                )}
                {classesList.length > 0 && (
                  <optgroup label="Pilih Kelas Spesifik">
                    {classesList.map((cls) => (
                      <option key={cls} value={cls}>
                        Kelas {cls}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            {/* Buttons Action */}
            <div className="flex flex-wrap items-center gap-2">
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>Import CSV Siswa</span>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => downloadDptTemplate(isSmp ? 'SMP' : 'SMA')}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
                title={`Unduh Format Contoh CSV (${isSmp ? 'SMP/MTs' : 'SMA/SMK'})`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Template CSV ({isSmp ? 'SMP' : 'SMA'})</span>
              </button>

              <button
                onClick={() => exportDptToCsv(voters, currentPeriod?.period_name || 'DPT')}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
                title="Ekspor Data DPT ke File CSV"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export CSV</span>
              </button>

              <button
                onClick={handleOpenAddVoter}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Siswa</span>
              </button>
            </div>
          </div>

          {/* DPT Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-center w-12">No</th>
                    <th className="px-4 py-3">NISN</th>
                    <th className="px-4 py-3">Nama Lengkap Siswa</th>
                    <th className="px-4 py-3">Kelas</th>
                    <th className="px-4 py-3 text-center">Gender</th>
                    <th className="px-4 py-3 text-center">Token PIN</th>
                    <th className="px-4 py-3 text-center">Status Suara</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredVoters.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-slate-400">
                        Tidak ada data pemilih yang sesuai dengan pencarian atau filter.
                      </td>
                    </tr>
                  ) : (
                    filteredVoters
                      .slice((dptPage - 1) * dptPageSize, dptPage * dptPageSize)
                      .map((voter, index) => (
                      <tr key={voter.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 text-center text-slate-400 font-mono">
                          {(dptPage - 1) * dptPageSize + index + 1}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">
                          {voter.nisn}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {voter.full_name}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 font-mono text-[11px] font-semibold text-slate-800">
                            {voter.class_name}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              voter.gender === 'L'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-pink-100 text-pink-800'
                            }`}
                          >
                            {voter.gender}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="px-2.5 py-1 rounded-md bg-slate-900 text-emerald-400 font-mono font-bold text-xs tracking-wider">
                            {voter.pin_plain}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {voter.has_voted ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Sudah Memilih
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Belum Memilih
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleEditVoter(voter)}
                              title="Edit Data Siswa (NISN, Nama, Kelas)"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            {!voter.has_voted && (
                              <button
                                onClick={() => handleResetPin(voter)}
                                title="Reset Token PIN"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteVoter(voter)}
                              title="Hapus Pemilih"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              currentPage={dptPage}
              totalItems={filteredVoters.length}
              pageSize={dptPageSize}
              onPageChange={(p) => setDptPage(p)}
              onPageSizeChange={(s) => {
                setDptPageSize(s);
                setDptPage(1);
              }}
              itemName="siswa pemilih"
            />

            <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 text-slate-500 text-xs flex items-center justify-between">
              <span>Menampilkan {Math.min(filteredVoters.length, (dptPage - 1) * dptPageSize + 1)} - {Math.min(filteredVoters.length, dptPage * dptPageSize)} dari {filteredVoters.length} pemilih tersaring (Total: {voters.length})</span>
              <span className="font-semibold text-slate-700">
                {voters.filter((v) => v.has_voted).length} sudah memilih &bull;{' '}
                {voters.filter((v) => !v.has_voted).length} belum memilih
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GENERATOR TOKEN PIN & CETAK KARTU SUARA */}
      {activeTab === 'token' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <div className="max-w-2xl">
              <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-indigo-600" />
                Pencetakan Kartu Suara &amp; Generator Token PIN
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Kartu suara berisi Nama, Kelas, NISN, QR-Code scanner bilik, serta PIN 6 karakter acak sekali pakai.
                Panitia dapat mencetak kartu ini di kertas A4 lalu memotongnya sesuai garis pandu untuk dibagikan kepada
                siswa sebelum memasuki bilik suara.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">Filter Kartu:</span>
                <select
                  value={selectedClassFilter}
                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                  className="py-1.5 px-3 rounded-xl border border-slate-300 text-xs bg-white text-slate-700 font-medium"
                >
                  <option value="ALL">Semua Tingkat &amp; Kelas ({voters.length})</option>
                  {isSmp ? (
                    <>
                      <option value="TINGKAT_7">Tingkat VII / Kelas 7</option>
                      <option value="TINGKAT_8">Tingkat VIII / Kelas 8</option>
                      <option value="TINGKAT_9">Tingkat IX / Kelas 9</option>
                    </>
                  ) : (
                    <>
                      <option value="TINGKAT_X">Tingkat X / Kelas 10</option>
                      <option value="TINGKAT_XI">Tingkat XI / Kelas 11</option>
                      <option value="TINGKAT_XII">Tingkat XII / Kelas 12</option>
                    </>
                  )}
                  {classesList.length > 0 && (
                    <optgroup label="Pilih Kelas Spesifik">
                      {classesList.map((cls) => (
                        <option key={cls} value={cls}>
                          Kelas {cls}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setIsPrintMode(true)}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Buka Tata Letak Cetak ({filteredVoters.length} Kartu)</span>
                </button>

                <button
                  onClick={handleBulkRegenerate}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                  <span>Generate Ulang PIN Massal</span>
                </button>
              </div>
            </div>
          </div>

          {/* Preview Kartu Demo */}
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
              Pratinjau Format Kartu Suara Fisik (1 Contoh):
            </h4>
            {voters.length > 0 ? (
              <div className="max-w-xs bg-white border-2 border-dashed border-slate-300 rounded-xl p-4 shadow-sm relative">
                <div className="text-center border-b border-slate-200 pb-2 mb-2">
                  <span className="text-[10px] font-extrabold text-blue-800 uppercase">
                    KARTU SUARA PEMILIH OSIS
                  </span>
                  <div className="text-xs font-bold text-slate-900">{school.name}</div>
                  <div className="text-[9px] text-slate-500">T.A {currentPeriod?.academic_year}</div>
                </div>

                <div className="space-y-1 text-xs">
                  <div>
                    <span className="text-[9px] text-slate-400 block uppercase">Nama Pemilih</span>
                    <strong className="text-slate-900">{voters[0].full_name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase">Kelas</span>
                      <strong className="font-mono">{voters[0].class_name}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block uppercase">NISN</span>
                      <strong className="font-mono">{voters[0].nisn}</strong>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 text-white rounded-lg p-2.5 text-center my-3">
                  <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold block">
                    KODE PIN RAHASIA
                  </span>
                  <span className="text-xl font-black font-mono tracking-widest text-emerald-400">
                    {voters[0].pin_plain}
                  </span>
                </div>

                <div className="text-[9px] text-slate-500 text-center italic">
                  Tunjukkan kartu ini kepada saksi di bilik suara digital.
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Belum ada pemilih di DPT.</p>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: MANAJEMEN PASLON */}
      {activeTab === 'paslon' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Daftar Pasangan Calon (Kandidat)
              </h3>
              <p className="text-xs text-slate-500">
                Kelola nomor urut, foto resmi, visi-misi, serta program kerja paslon
              </p>
            </div>
            <button
              onClick={() => {
                setEditingCandidate(null);
                setCandForm({
                  ballot_number: candidates.length + 1,
                  chairman_name: '',
                  vice_chairman_name: '',
                  chairman_class: '',
                  vice_chairman_class: '',
                  photo_url: '',
                  vision: '',
                  mission: '',
                  programs: '',
                  video_url: '',
                });
                setIsCandidateModalOpen(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Pasangan Calon</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {candidates.map((cand) => (
              <div
                key={cand.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-4/3 bg-slate-100">
                    <img
                      src={cand.photo_url}
                      alt={cand.chairman_name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-white/95 px-2.5 py-1 rounded-lg text-xs font-mono font-bold text-slate-900 shadow-xs">
                      No. 0{cand.ballot_number}
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <h4 className="font-bold text-sm text-slate-900">
                      {cand.chairman_name} &amp; {cand.vice_chairman_name}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {cand.chairman_class} / {cand.vice_chairman_class}
                    </p>
                    <p className="text-xs text-slate-600 italic line-clamp-2 mt-2">
                      &ldquo;{cand.vision}&rdquo;
                    </p>
                  </div>
                </div>

                <div className="p-4 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50">
                  <button
                    onClick={() => handleEditCandidate(cand)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors flex items-center gap-1"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteCandidate(cand)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: MONITORING BILIK SUARA */}
      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          {/* Ringkasan Partisipasi Per Tingkat */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Partisipasi Per Tingkat / Jenjang ({isSmp ? 'SMP / MTs' : 'SMA / SMK / MA'})
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Ringkasan pemilih yang telah menyalurkan hak suara dikelompokkan per tingkat angkatan.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(isSmp
                ? [
                    { key: 'TINGKAT_7', label: 'Tingkat VII (Kelas 7)' },
                    { key: 'TINGKAT_8', label: 'Tingkat VIII (Kelas 8)' },
                    { key: 'TINGKAT_9', label: 'Tingkat IX (Kelas 9)' },
                  ]
                : [
                    { key: 'TINGKAT_10', label: 'Tingkat X (Kelas 10)' },
                    { key: 'TINGKAT_11', label: 'Tingkat XI (Kelas 11)' },
                    { key: 'TINGKAT_12', label: 'Tingkat XII (Kelas 12)' },
                  ]
              ).map((lvl) => {
                const inLevel = voters.filter((v) => matchLevel(v.class_name, lvl.key));
                const votedInLevel = inLevel.filter((v) => v.has_voted).length;
                const percentage = inLevel.length > 0 ? (votedInLevel / inLevel.length) * 100 : 0;
                return (
                  <div key={lvl.key} className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-slate-800">{lvl.label}</span>
                      <span className="font-mono text-xs font-bold text-indigo-700">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden mb-2">
                      <div
                        className="bg-indigo-600 h-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-slate-600 flex justify-between font-medium">
                      <span>Sudah: <strong className="text-emerald-600">{votedInLevel}</strong></span>
                      <span>Belum: <strong className="text-amber-600">{inLevel.length - votedInLevel}</strong></span>
                      <span>Total: <strong>{inLevel.length}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-4">
              Rekapitulasi Partisipasi Per Kelas ({classesList.length} Kelas Terdaftar)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {classesList.map((cls) => {
                const inClass = voters.filter((v) => v.class_name === cls);
                const votedInClass = inClass.filter((v) => v.has_voted).length;
                const percentage = inClass.length > 0 ? (votedInClass / inClass.length) * 100 : 0;
                return (
                  <div key={cls} className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xs text-slate-800">Kelas {cls}</span>
                      <span className="font-mono text-xs font-bold text-blue-600">
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mb-2">
                      <div
                        className="bg-emerald-500 h-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-slate-500 flex justify-between">
                      <span>Sudah: {votedInClass}</span>
                      <span>Belum: {inClass.length - votedInClass}</span>
                      <span>Total: {inClass.length}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal Add/Edit Candidate */}
      {isCandidateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="bg-indigo-700 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingCandidate ? 'Edit Data Paslon' : 'Tambah Pasangan Calon Baru'}
              </h3>
              <button
                onClick={() => setIsCandidateModalOpen(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCandidate} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">No. Urut</label>
                  <input
                    type="number"
                    min={1}
                    value={candForm.ballot_number}
                    onChange={(e) => setCandForm({ ...candForm, ballot_number: Number(e.target.value) })}
                    className="w-full p-2 rounded-lg border border-slate-300 font-mono"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">URL Foto (3:4)</label>
                  <input
                    type="url"
                    value={candForm.photo_url}
                    onChange={(e) => setCandForm({ ...candForm, photo_url: e.target.value })}
                    placeholder="https://..."
                    className="w-full p-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Calon Ketua</label>
                  <input
                    type="text"
                    value={candForm.chairman_name}
                    onChange={(e) => setCandForm({ ...candForm, chairman_name: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kelas Calon Ketua</label>
                  <input
                    type="text"
                    value={candForm.chairman_class}
                    onChange={(e) => setCandForm({ ...candForm, chairman_class: e.target.value })}
                    placeholder={isSmp ? 'Contoh: VIII-A / 8-B' : 'Contoh: XI MIPA 1 / 11-A'}
                    className="w-full p-2 rounded-lg border border-slate-300"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Calon Wakil</label>
                  <input
                    type="text"
                    value={candForm.vice_chairman_name}
                    onChange={(e) => setCandForm({ ...candForm, vice_chairman_name: e.target.value })}
                    className="w-full p-2 rounded-lg border border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kelas Calon Wakil</label>
                  <input
                    type="text"
                    value={candForm.vice_chairman_class}
                    onChange={(e) => setCandForm({ ...candForm, vice_chairman_class: e.target.value })}
                    placeholder={isSmp ? 'Contoh: VII-C / 7-A' : 'Contoh: X-B / 10-2'}
                    className="w-full p-2 rounded-lg border border-slate-300"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Visi Paslon</label>
                <textarea
                  rows={2}
                  value={candForm.vision}
                  onChange={(e) => setCandForm({ ...candForm, vision: e.target.value })}
                  placeholder="Rumusan visi paslon..."
                  className="w-full p-2 rounded-lg border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Misi Paslon (1 Baris per poin)
                </label>
                <textarea
                  rows={3}
                  value={candForm.mission}
                  onChange={(e) => setCandForm({ ...candForm, mission: e.target.value })}
                  placeholder="Misi 1&#10;Misi 2&#10;Misi 3"
                  className="w-full p-2 rounded-lg border border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Program Kerja Unggulan (1 Baris per program)
                </label>
                <textarea
                  rows={3}
                  value={candForm.programs}
                  onChange={(e) => setCandForm({ ...candForm, programs: e.target.value })}
                  placeholder="Program 1&#10;Program 2"
                  className="w-full p-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCandidateModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700"
                >
                  Simpan Paslon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Single Voter */}
      {isVoterModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-indigo-700 text-white p-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingVoter ? `Edit Data Pemilih DPT (${editingVoter.nisn})` : 'Tambah Pemilih Manual ke DPT'}
              </h3>
              <button
                onClick={() => {
                  setIsVoterModalOpen(false);
                  setEditingVoter(null);
                }}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVoter} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  NISN (10 Digit Angka)
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={voterForm.nisn}
                  onChange={(e) => setVoterForm({ ...voterForm, nisn: e.target.value.replace(/\D/g, '') })}
                  placeholder="0061234501"
                  className="w-full p-2.5 rounded-lg border border-slate-300 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  value={voterForm.full_name}
                  onChange={(e) => setVoterForm({ ...voterForm, full_name: e.target.value })}
                  placeholder="Nama sesuai buku induk"
                  className="w-full p-2.5 rounded-lg border border-slate-300"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kelas</label>
                  <input
                    type="text"
                    value={voterForm.class_name}
                    onChange={(e) => setVoterForm({ ...voterForm, class_name: e.target.value })}
                    placeholder={isSmp ? 'VII-A / 8-B / IX-1' : 'X-A / XI MIPA 1 / 12-2'}
                    className="w-full p-2.5 rounded-lg border border-slate-300"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={voterForm.gender}
                    onChange={(e) => setVoterForm({ ...voterForm, gender: e.target.value as 'L' | 'P' })}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 italic">
                {editingVoter
                  ? '*Perubahan NISN, Nama, dan Kelas tidak mereset status suara atau token PIN yang sudah ada.'
                  : '*Sistem akan secara otomatis men-generate token PIN 6 karakter acak unik untuk siswa baru ini.'}
              </p>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsVoterModalOpen(false);
                    setEditingVoter(null);
                  }}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 cursor-pointer"
                >
                  {editingVoter ? 'Simpan Perubahan' : 'Simpan Pemilih'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 5: GANTI PASSWORD */}
      {activeTab === 'password' && (
        <ChangePasswordView
          user={authUser || { name: 'Panitia Pemilihan', email: 'panitia@sman1teladan.sch.id', role: 'panitia' }}
          userRoleLabel="Panitia Pemilihan (KPPS / MPK)"
        />
      )}

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleConfirmDelete}
        title={deleteModal.type === 'voter' ? 'Hapus Siswa dari DPT' : 'Hapus Pasangan Calon'}
        itemName={deleteModal.name}
        warningDetails={deleteModal.warningDetails}
      />
    </div>
  );
};
