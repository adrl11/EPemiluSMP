import React from 'react';

export type AppLogoVariant = 'horizontal' | 'icon' | 'symbol' | 'monochrome' | 'watermark';

interface AppLogoProps {
  variant?: AppLogoVariant;
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  className?: string;
  inverted?: boolean; // When rendered on dark background
  schoolName?: string;
  showTagline?: boolean;
  tagline?: string;
  id?: string;
}

/**
 * Simbol Vektor 3D E-PILKETOS DIGITAL (Varian Berwarna Penuh)
 * Berdasarkan Panduan Identitas Visual Resmi:
 * - Kotak Suara Heksagonal Isometrik 3D
 * - Surat Suara Putih Masuk ke Slot Atas
 * - Perisai Royal Blue (#2563EB) dengan Centang Putih
 * - Kubus Piksel Digital (Emerald #10B981 & Gold #FBBF24)
 * - Pita Lengkung Dinamis Gold (#FBBF24) di Kanan Bawah
 */
export const AppLogoSymbol: React.FC<{ className?: string; size?: number | string }> = ({
  className = 'w-10 h-10',
  size,
}) => {
  const [imgError, setImgError] = React.useState(false);
  const style = size ? { width: size, height: size } : undefined;

  if (!imgError) {
    return (
      <img
        src="/logo-epilektos.png"
        alt="Logo E-PILKETOS DIGITAL"
        className={`object-contain inline-block drop-shadow-xs ${className}`}
        style={style}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-label="Logo Simbol E-Pilketos Digital"
    >
      <defs>
        {/* Gradasi Hexagon Luar / Sayap Belakang */}
        <linearGradient id="ep-hex-bg" x1="40" y1="30" x2="200" y2="210" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1D4ED8" />
          <stop offset="50%" stopColor="#1E40AF" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>

        {/* Gradasi Kotak Suara 3D Sisi Kiri */}
        <linearGradient id="ep-box-left" x1="70" y1="90" x2="120" y2="190" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1E3A8A" />
        </linearGradient>

        {/* Gradasi Kotak Suara 3D Sisi Kanan */}
        <linearGradient id="ep-box-right" x1="120" y1="90" x2="175" y2="190" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1E40AF" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>

        {/* Permukaan Atas Kotak */}
        <linearGradient id="ep-box-top" x1="70" y1="70" x2="175" y2="115" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="50%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#CBD5E1" />
        </linearGradient>

        {/* Gradasi Pita Emas (Gold Swoosh) */}
        <linearGradient id="ep-gold-swoosh" x1="100" y1="210" x2="215" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="50%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#FCD34D" />
        </linearGradient>

        {/* Aksen Teal / Cyan Kiri Bawah */}
        <linearGradient id="ep-teal-accent" x1="60" y1="180" x2="110" y2="220" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#0D9488" />
        </linearGradient>

        {/* Perisai Lambang Integritas */}
        <linearGradient id="ep-shield-grad" x1="90" y1="110" x2="150" y2="185" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="50%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>

        {/* Drop Shadows Halus */}
        <filter id="ep-shadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#0F172A" floodOpacity="0.25" />
        </filter>
        <filter id="ep-glow-gold" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#F59E0B" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Hexagon Frame Luar / Bayangan Siluet Modern */}
      <path
        d="M120 18 L195 62 L195 150 L120 194 L45 150 L45 62 Z"
        fill="url(#ep-hex-bg)"
        filter="url(#ep-shadow)"
      />

      {/* Aksen Sayap Teal di Kiri Bawah */}
      <path
        d="M45 130 C65 170 90 200 115 210 C95 200 70 175 50 145 Z"
        fill="url(#ep-teal-accent)"
        opacity="0.9"
      />

      {/* Pita Dinamis Gold Swoosh di Kanan Bawah */}
      <path
        d="M105 208 C135 200 175 180 205 110 C198 135 175 170 135 190 C120 198 108 204 105 208 Z"
        fill="url(#ep-gold-swoosh)"
        filter="url(#ep-glow-gold)"
      />

      {/* KOTAK SUARA HEKSAGONAL 3D */}
      {/* Sisi Kiri Kotak */}
      <path
        d="M72 108 L120 135 L120 195 L72 165 Z"
        fill="url(#ep-box-left)"
      />

      {/* Sisi Kanan Kotak */}
      <path
        d="M120 135 L168 108 L168 165 L120 195 Z"
        fill="url(#ep-box-right)"
      />

      {/* Permukaan Atas Kotak (Dengan Lubang Surat Suara) */}
      <path
        d="M120 78 L168 108 L120 135 L72 108 Z"
        fill="url(#ep-box-top)"
        stroke="#FFFFFF"
        strokeWidth="1.5"
      />

      {/* Celah / Slot Surat Suara */}
      <path
        d="M102 104 L138 104"
        stroke="#1E293B"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* SURAT SUARA PUTIH (Meluncur Masuk ke Slot) */}
      <g transform="rotate(-6 120 85)">
        <polygon
          points="104,50 136,53 133,96 101,93"
          fill="#FFFFFF"
          stroke="#E2E8F0"
          strokeWidth="1.5"
          filter="url(#ep-shadow)"
        />
        {/* Garis-garis isi surat suara mini */}
        <line x1="108" y1="62" x2="131" y2="64" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
        <line x1="108" y1="70" x2="128" y2="72" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
        <line x1="108" y1="78" x2="122" y2="80" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* PERISAI & CENTANG DI MUKA KOTAK */}
      <g transform="translate(0, 5)">
        <path
          d="M120 120 L145 130 C145 155 135 172 120 180 C105 172 95 155 95 130 Z"
          fill="url(#ep-shield-grad)"
          stroke="#FFFFFF"
          strokeWidth="2"
        />
        {/* Tanda Centang Putih (Checkmark) */}
        <path
          d="M108 145 L116 153 L132 137"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* KUBUS PIKSEL DIGITAL (Kanan Atas) */}
      {/* Emerald Pixel 1 */}
      <rect x="180" y="62" width="12" height="12" rx="2" fill="#10B981" />
      {/* Emerald Pixel 2 */}
      <rect x="195" y="80" width="14" height="14" rx="2.5" fill="#10B981" />
      {/* Emerald Pixel 3 */}
      <rect x="188" y="100" width="10" height="10" rx="2" fill="#10B981" opacity="0.85" />
      {/* Gold Pixel 1 */}
      <rect x="170" y="78" width="15" height="15" rx="3" fill="#FBBF24" />
      {/* Gold Pixel 2 */}
      <rect x="190" y="118" width="11" height="11" rx="2" fill="#F59E0B" opacity="0.9" />
    </svg>
  );
};

/**
 * Simbol Vektor Monokrom E-PILKETOS DIGITAL (Untuk Dokumen Cetak & Watermark)
 * Menggunakan gradasi grayscale berpresisi tinggi (hitam, slate, perak, putih)
 * Sangat kontras, elegan, dan profesional saat dicetak hitam-putih.
 */
export const AppLogoSymbolMonochrome: React.FC<{ className?: string; size?: number | string }> = ({
  className = 'w-10 h-10',
  size,
}) => {
  const [imgError, setImgError] = React.useState(false);
  const style = size ? { width: size, height: size } : undefined;

  if (!imgError) {
    return (
      <img
        src="/logo-epilektos.png"
        alt="Logo Monokrom E-PILKETOS DIGITAL"
        className={`object-contain inline-block filter grayscale contrast-125 brightness-90 ${className}`}
        style={style}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-label="Logo Monokrom E-Pilketos Digital"
    >
      <defs>
        <linearGradient id="ep-mono-bg" x1="40" y1="30" x2="200" y2="210" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="50%" stopColor="#334155" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
        <linearGradient id="ep-mono-box-left" x1="70" y1="90" x2="120" y2="190" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#64748B" />
          <stop offset="100%" stopColor="#1E293B" />
        </linearGradient>
        <linearGradient id="ep-mono-box-right" x1="120" y1="90" x2="175" y2="190" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
        <linearGradient id="ep-mono-box-top" x1="70" y1="70" x2="175" y2="115" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="50%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#CBD5E1" />
        </linearGradient>
        <linearGradient id="ep-mono-swoosh" x1="100" y1="210" x2="215" y2="110" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#64748B" />
          <stop offset="50%" stopColor="#94A3B8" />
          <stop offset="100%" stopColor="#CBD5E1" />
        </linearGradient>
        <linearGradient id="ep-mono-shield" x1="90" y1="110" x2="150" y2="185" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="50%" stopColor="#334155" />
          <stop offset="100%" stopColor="#1E293B" />
        </linearGradient>
      </defs>

      {/* Hexagon Frame Luar Grayscale */}
      <path
        d="M120 18 L195 62 L195 150 L120 194 L45 150 L45 62 Z"
        fill="url(#ep-mono-bg)"
      />

      {/* Sayap Aksen Bawah Monokrom */}
      <path
        d="M45 130 C65 170 90 200 115 210 C95 200 70 175 50 145 Z"
        fill="#64748B"
        opacity="0.6"
      />

      {/* Pita Dinamis Monokrom Kanan Bawah */}
      <path
        d="M105 208 C135 200 175 180 205 110 C198 135 175 170 135 190 C120 198 108 204 105 208 Z"
        fill="url(#ep-mono-swoosh)"
      />

      {/* Kotak Suara 3D Sisi Kiri */}
      <path
        d="M72 108 L120 135 L120 195 L72 165 Z"
        fill="url(#ep-mono-box-left)"
      />

      {/* Kotak Suara 3D Sisi Kanan */}
      <path
        d="M120 135 L168 108 L168 165 L120 195 Z"
        fill="url(#ep-mono-box-right)"
      />

      {/* Permukaan Atas Kotak */}
      <path
        d="M120 78 L168 108 L120 135 L72 108 Z"
        fill="url(#ep-mono-box-top)"
        stroke="#FFFFFF"
        strokeWidth="1.5"
      />

      {/* Celah Slot */}
      <path
        d="M102 104 L138 104"
        stroke="#0F172A"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Surat Suara Putih */}
      <g transform="rotate(-6 120 85)">
        <polygon
          points="104,50 136,53 133,96 101,93"
          fill="#FFFFFF"
          stroke="#CBD5E1"
          strokeWidth="1.5"
        />
        <line x1="108" y1="62" x2="131" y2="64" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
        <line x1="108" y1="70" x2="128" y2="72" stroke="#64748B" strokeWidth="2" strokeLinecap="round" />
        <line x1="108" y1="78" x2="122" y2="80" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Perisai & Centang Monokrom */}
      <g transform="translate(0, 5)">
        <path
          d="M120 120 L145 130 C145 155 135 172 120 180 C105 172 95 155 95 130 Z"
          fill="url(#ep-mono-shield)"
          stroke="#FFFFFF"
          strokeWidth="2"
        />
        <path
          d="M108 145 L116 153 L132 137"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* Kubus Piksel Digital Monokrom */}
      <rect x="180" y="62" width="12" height="12" rx="2" fill="#94A3B8" />
      <rect x="195" y="80" width="14" height="14" rx="2.5" fill="#CBD5E1" />
      <rect x="188" y="100" width="10" height="10" rx="2" fill="#64748B" />
      <rect x="170" y="78" width="15" height="15" rx="3" fill="#E2E8F0" />
      <rect x="190" y="118" width="11" height="11" rx="2" fill="#475569" />
    </svg>
  );
};

/**
 * Komponen Utama E-PILKETOS DIGITAL
 */
export const AppLogo: React.FC<AppLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  className = '',
  inverted = false,
  schoolName,
  showTagline = true,
  tagline = 'Sistem Pemilihan Ketua & Wakil Ketua OSIS/OSIM',
  id,
}) => {
  // Ukuran simbol
  const symbolSize =
    typeof size === 'number'
      ? size
      : size === 'sm'
      ? 34
      : size === 'md'
      ? 44
      : size === 'lg'
      ? 56
      : 72;

  // 1. VARIAN WATERMARK (Khusus Dokumen Resmi Cetak)
  if (variant === 'watermark') {
    return (
      <div
        id={id}
        className={`pointer-events-none select-none flex items-center justify-center ${className}`}
        aria-hidden="true"
      >
        <AppLogoSymbolMonochrome
          size={typeof size === 'number' ? size : 340}
          className="max-w-full max-h-full drop-shadow-xs"
        />
      </div>
    );
  }

  // 2. VARIAN MONOKROM BIASA
  if (variant === 'monochrome') {
    return (
      <div id={id} className={`inline-flex items-center gap-3 ${className}`}>
        <AppLogoSymbolMonochrome size={symbolSize} />
        {showTagline && (
          <div className="flex flex-col">
            <span className="font-black text-slate-800 tracking-tight text-lg leading-tight">
              E-PILKETOS
            </span>
            <span className="text-[10px] font-bold tracking-[0.25em] text-slate-500 uppercase">
              DIGITAL
            </span>
            {schoolName && (
              <span className="text-[11px] text-slate-600 font-medium mt-0.5">{schoolName}</span>
            )}
          </div>
        )}
      </div>
    );
  }

  // 3. VARIAN IKON APLIKASI (Squircle Berlatar Navy Sesuai Referensi)
  if (variant === 'icon') {
    return (
      <div
        id={id}
        className={`inline-flex items-center justify-center rounded-2xl bg-[#111A35] p-2 shadow-md border border-slate-700/50 flex-shrink-0 ${className}`}
        style={{ width: symbolSize + 12, height: symbolSize + 12 }}
      >
        <AppLogoSymbol size={symbolSize} />
      </div>
    );
  }

  // 4. VARIAN SIMBOL MURNI (Tanpa background & tanpa teks)
  if (variant === 'symbol') {
    return (
      <div id={id} className={`inline-flex items-center justify-center ${className}`}>
        <AppLogoSymbol size={symbolSize} />
      </div>
    );
  }

  // 5. VARIAN HORIZONTAL (Standar untuk Navbar & Header)
  return (
    <div id={id} className={`inline-flex items-center gap-3 ${className}`}>
      {/* Simbol Heksagonal */}
      <div className="relative flex-shrink-0">
        <AppLogoSymbol size={symbolSize} />
      </div>

      {/* Tipografi Resmi Sesuai Brand Guidelines */}
      <div className="flex flex-col justify-center min-w-0">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span
            className={`font-black text-lg sm:text-xl tracking-tight leading-none ${
              inverted ? 'text-white' : 'text-[#111A35]'
            }`}
          >
            E-PILKETOS
          </span>
          <span
            className={`font-extrabold text-xs sm:text-sm tracking-[0.25em] leading-none ${
              inverted ? 'text-blue-400' : 'text-[#2563EB]'
            }`}
          >
            DIGITAL
          </span>
        </div>

        {showTagline && (
          <p
            className={`text-[10px] sm:text-[11px] font-medium leading-snug truncate mt-0.5 ${
              inverted ? 'text-slate-300' : 'text-slate-600'
            }`}
          >
            {tagline}
          </p>
        )}

        {schoolName && (
          <span
            className={`text-[10px] sm:text-[11px] font-semibold truncate leading-tight ${
              inverted ? 'text-amber-300' : 'text-slate-800'
            }`}
          >
            {schoolName}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * 4 Pilar Nilai E-PILKETOS DIGITAL (Sesuai Referensi Brand Guideline)
 */
export const AppBrandPillars: React.FC<{ className?: string; compact?: boolean }> = ({
  className = '',
  compact = false,
}) => {
  const pillars = [
    {
      title: 'Aman & Terpercaya',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-emerald-500" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      ),
      desc: 'Token PIN acak sekali pakai & enkripsi voting',
    },
    {
      title: 'Transparan & Adil',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-blue-500" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      desc: 'Quick count real-time & Berita Acara resmi',
    },
    {
      title: 'Berbasis Digital',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-indigo-500" stroke="currentColor" strokeWidth="2">
          <rect width="20" height="14" x="2" y="3" rx="2" />
          <line x1="8" x2="16" y1="21" y2="21" />
          <line x1="12" x2="12" y1="17" y2="21" />
        </svg>
      ),
      desc: 'Paperless, efisien, dan ramah lingkungan',
    },
    {
      title: 'Untuk Seluruh Siswa',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-amber-500" stroke="currentColor" strokeWidth="2">
          <path d="M14 22v-4a2 2 0 1 0-4 0v4" />
          <path d="m18 10 3.447 1.724a1 1 0 0 1 .553.894V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7.382a1 1 0 0 1 .553-.894L6 10" />
          <path d="M18 5v17" />
          <path d="m4 6 7.106-3.553a2 2 0 0 1 1.788 0L20 6" />
          <path d="M6 5v17" />
          <circle cx="12" cy="9" r="2" />
        </svg>
      ),
      desc: 'Antarmuka ramah siswa, cepat dan mudah',
    },
  ];

  if (compact) {
    return (
      <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2.5 ${className}`}>
        {pillars.map((p, i) => (
          <div
            key={i}
            className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs text-xs"
          >
            <div className="shrink-0">{p.icon}</div>
            <span className="font-semibold text-slate-200">{p.title}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {pillars.map((p, i) => (
        <div
          key={i}
          className="flex items-start gap-3.5 p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:shadow-md transition-shadow"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-inner">
            {p.icon}
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">{p.title}</h4>
            <p className="text-[11px] text-slate-500 leading-snug mt-0.5">{p.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
