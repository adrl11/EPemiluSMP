import React, { useState, useEffect, useRef } from 'react';
import { School, ElectionPeriod, UserRole, AuthUser, PanitiaTab, AdminTab } from '../../types';
import {
  Vote,
  BarChart3,
  Users,
  ShieldCheck,
  Clock,
  RotateCcw,
  LogIn,
  LogOut,
  KeyRound,
  Building,
  User,
  ChevronDown,
} from 'lucide-react';
import { db } from '../../lib/storage';

interface HeaderProps {
  currentRole: UserRole;
  onSelectRole: (role: UserRole) => void;
  school: School;
  activePeriod: ElectionPeriod | null;
  authUser: AuthUser | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  panitiaTab: PanitiaTab;
  onSelectPanitiaTab: (tab: PanitiaTab) => void;
  adminTab: AdminTab;
  onSelectAdminTab: (tab: AdminTab) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onSelectRole,
  school,
  activePeriod,
  authUser,
  onOpenLogin,
  onLogout,
  panitiaTab,
  onSelectPanitiaTab,
  adminTab,
  onSelectAdminTab,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!userDropdownOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setUserDropdownOpen(false);
      }
    };

    // Use a zero-delay timeout so this listener doesn't catch the initial opening click
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }, 10);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [userDropdownOpen]);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleDateString('id-ID', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleResetData = () => {
    if (confirm('Reset ulang data pemilihan ke setelan awal (demo)? Seluruh perubahan transaksi saat ini akan dikembalikan.')) {
      db.resetToDefault();
      window.location.reload();
    }
  };

  const isOsim = school.type === 'OSIM';
  const orgTitle = isOsim ? 'E-PILKOSIM DIGITAL' : 'E-PILKETOS DIGITAL';
  const orgSub = isOsim
    ? 'Sistem Pemilihan Ketua & Wakil Ketua OSIM (Madrasah)'
    : 'Sistem Pemilihan Ketua & Wakil Ketua OSIS Terpadu';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      {/* Top Banner Bar */}
      <div className="bg-slate-900 text-slate-200 text-xs px-4 py-1.5 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium border border-emerald-500/30 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Server Bilik Suara Aktif
          </span>
          <span className="hidden sm:inline text-slate-400">|</span>
          <span className="hidden sm:inline font-mono text-[11px] text-slate-300">
            NPSN: {school.npsn}
          </span>
          <span className="hidden md:inline text-slate-400">|</span>
          <span className="hidden md:inline text-slate-300">
            {activePeriod?.period_name || 'Tidak ada periode aktif'}
          </span>
          {authUser && (
            <>
              <span className="hidden lg:inline text-slate-400">|</span>
              <span className="hidden lg:inline text-amber-300 font-medium">
                Sesi Aktif: {authUser.role === 'admin' ? 'Administrator' : 'Panitia'} ({authUser.name})
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-4 text-slate-300">
          <div className="flex items-center gap-1.5 text-[11px] bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700/60">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                db.isSupabaseConnected() ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
              }`}
            />
            <span className={db.isSupabaseConnected() ? 'text-emerald-300 font-semibold' : 'text-slate-400 font-normal'}>
              {db.isSupabaseConnected() ? 'Cloud Terhubung' : 'Penyimpanan Lokal'}
            </span>
          </div>
          <div className="flex items-center gap-1 font-mono text-[11px]">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{timeStr}</span>
          </div>
          <button
            onClick={handleResetData}
            title="Reset Data Demo"
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Reset Demo</span>
          </button>
        </div>
      </div>

      {/* Main Nav & Identity */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between py-3 gap-3">
          {/* Institution Branding */}
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-blue-100 flex-shrink-0">
              <Vote className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight flex items-center gap-1.5">
                  {orgTitle}
                </h1>
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-sm ${
                    isOsim
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-blue-100 text-blue-800 border border-blue-300'
                  }`}
                >
                  {school.type}
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium truncate max-w-xs sm:max-w-md">
                {school.name} &bull; <span className="text-slate-500">{orgSub}</span>
              </p>
            </div>
          </div>

          {/* Navigation Bar */}
          <nav className="flex items-center gap-2 flex-wrap sm:flex-nowrap relative overflow-visible">
            {/* PUBLIC NAVIGATION (When NOT Logged In) */}
            {!authUser && (
              <>
                <button
                  onClick={() => onSelectRole('public')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    currentRole === 'public'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Live Quick Count</span>
                </button>

                <button
                  onClick={() => onSelectRole('siswa')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    currentRole === 'siswa'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Vote className="w-4 h-4" />
                  <span>Bilik Suara Siswa</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                </button>

                {/* Gated Login Button */}
                <button
                  onClick={onOpenLogin}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer ml-1"
                >
                  <LogIn className="w-4 h-4 text-blue-400" />
                  <span>Login Petugas / Admin</span>
                </button>
              </>
            )}

            {/* PANITIA NAVIGATION (When Logged In as Panitia) */}
            {authUser?.role === 'panitia' && (
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap relative">
                {/* Switch to Panitia Dashboard */}
                <button
                  onClick={() => onSelectRole('panitia')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    currentRole === 'panitia'
                      ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-200'
                      : 'text-slate-700 bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Portal Panitia</span>
                </button>

                {/* Quick Link to Quick Count */}
                <button
                  onClick={() => onSelectRole('public')}
                  title="Lihat Papan Live Quick Count"
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    currentRole === 'public'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Live Quick Count</span>
                </button>

                <div className="h-6 w-px bg-slate-200 mx-1 hidden md:block"></div>

                {/* Panitia User Profile with Interactive Dropdown (Logout & Ganti Password) */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    id="panitia-user-profile-btn"
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setUserDropdownOpen((prev) => !prev);
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                      userDropdownOpen
                        ? 'bg-indigo-100 border-indigo-300 text-indigo-950 ring-2 ring-indigo-200'
                        : 'bg-indigo-50/90 hover:bg-indigo-100 border-indigo-200/90 text-indigo-950'
                    }`}
                    title="Klik untuk menu akun (Ganti Kata Sandi, Keluar)"
                    aria-expanded={userDropdownOpen}
                  >
                    <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-slate-900 truncate max-w-[120px] leading-tight">
                        {authUser.name}
                      </span>
                      <span className="text-[10px] text-indigo-600 font-medium leading-tight">
                        Panitia Pemilihan
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-indigo-600 transition-transform duration-200 ${
                        userDropdownOpen ? 'rotate-180 text-indigo-900' : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <div
                      id="panitia-dropdown-menu"
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-slate-200 py-1.5 z-[100] text-xs"
                    >
                      <div className="px-4 py-2.5 border-b border-slate-100">
                        <p className="font-bold text-slate-900 truncate">{authUser.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono truncate">{authUser.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700">
                          Panitia Pemilihan
                        </span>
                      </div>

                      <div className="py-1">
                        <button
                          id="panitia-menu-password-btn"
                          type="button"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            onSelectPanitiaTab('password');
                            onSelectRole('panitia');
                          }}
                          className="w-full px-4 py-2.5 text-left text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <KeyRound className="w-4 h-4 text-slate-400" />
                          <span>Ganti Kata Sandi</span>
                        </button>
                      </div>

                      <div className="border-t border-slate-100 pt-1">
                        <button
                          id="panitia-menu-logout-btn"
                          type="button"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            onLogout();
                          }}
                          className="w-full px-4 py-2.5 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer font-bold"
                        >
                          <LogOut className="w-4 h-4 text-rose-600" />
                          <span>Keluar (Log-Out)</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Direct Quick Logout Button */}
                <button
                  id="panitia-quick-logout-btn"
                  type="button"
                  onClick={() => {
                    setUserDropdownOpen(false);
                    onLogout();
                  }}
                  title="Keluar dari akun (Log-Out)"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition-all cursor-pointer shadow-2xs shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600" />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </div>
            )}

            {/* ADMIN NAVIGATION (When Logged In as Admin) */}
            {authUser?.role === 'admin' && (
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap relative">
                {/* Switch to Admin Dashboard */}
                <button
                  onClick={() => onSelectRole('admin')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    currentRole === 'admin'
                      ? 'bg-slate-900 text-white shadow-sm ring-2 ring-slate-300'
                      : 'text-slate-700 bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Portal Admin</span>
                </button>

                {/* Quick Link to Quick Count */}
                <button
                  onClick={() => onSelectRole('public')}
                  title="Lihat Papan Live Quick Count"
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    currentRole === 'public'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Live Quick Count</span>
                </button>

                <div className="h-6 w-px bg-slate-200 mx-1 hidden md:block"></div>

                {/* Admin User Profile with Interactive Dropdown (Logout & Ganti Password) */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    id="admin-user-profile-btn"
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setUserDropdownOpen((prev) => !prev);
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                      userDropdownOpen
                        ? 'bg-slate-200 border-slate-400 text-slate-950 ring-2 ring-slate-300'
                        : 'bg-slate-100 hover:bg-slate-200/80 border-slate-300/80 text-slate-900'
                    }`}
                    title="Klik untuk menu akun (Ganti Kata Sandi, Keluar)"
                    aria-expanded={userDropdownOpen}
                  >
                    <div className="w-6 h-6 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-[11px] shrink-0">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-slate-800 truncate max-w-[120px] leading-tight">
                        {authUser.name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium leading-tight">
                        Administrator
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${
                        userDropdownOpen ? 'rotate-180 text-slate-900' : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {userDropdownOpen && (
                    <div
                      id="admin-dropdown-menu"
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-slate-200 py-1.5 z-[100] text-xs"
                    >
                      <div className="px-4 py-2.5 border-b border-slate-100">
                        <p className="font-bold text-slate-900 truncate">{authUser.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono truncate">{authUser.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                          Administrator
                        </span>
                      </div>

                      <div className="py-1">
                        <button
                          id="admin-menu-password-btn"
                          type="button"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            onSelectAdminTab('password');
                            onSelectRole('admin');
                          }}
                          className="w-full px-4 py-2.5 text-left text-slate-700 hover:bg-slate-100 hover:text-slate-900 flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <KeyRound className="w-4 h-4 text-slate-400" />
                          <span>Ganti Kata Sandi</span>
                        </button>
                      </div>

                      <div className="border-t border-slate-100 pt-1">
                        <button
                          id="admin-menu-logout-btn"
                          type="button"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            onLogout();
                          }}
                          className="w-full px-4 py-2.5 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer font-bold"
                        >
                          <LogOut className="w-4 h-4 text-rose-600" />
                          <span>Keluar (Log-Out)</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Direct Quick Logout Button */}
                <button
                  id="admin-quick-logout-btn"
                  type="button"
                  onClick={() => {
                    setUserDropdownOpen(false);
                    onLogout();
                  }}
                  title="Keluar dari akun (Log-Out)"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition-all cursor-pointer shadow-2xs shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600" />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
