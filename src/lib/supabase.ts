import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

export interface SupabaseConfigState {
  url: string;
  key: string;
  isConfigured: boolean;
  source: 'env' | 'server' | 'custom' | 'none';
}

// Cek dan tangkap konfigurasi dari parameter URL (misal scan QR / share link antar-perangkat)
function checkUrlParameters(): { url: string; key: string } | null {
  if (typeof window === 'undefined') return null;

  try {
    // 1. Cek dari Hash (#supabase_config=...)
    const hash = window.location.hash;
    if (hash && hash.includes('supabase_config=')) {
      const match = hash.match(/supabase_config=([^&]+)/);
      if (match && match[1]) {
        try {
          const decoded = JSON.parse(atob(decodeURIComponent(match[1])));
          if (decoded.url && decoded.key && decoded.url.startsWith('http')) {
            // Bersihkan hash dari URL agar tidak bocor di browser bar
            window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
            return { url: decoded.url.trim(), key: decoded.key.trim() };
          }
        } catch {
          // ignore parsing error
        }
      }
    }

    // 2. Cek dari Query Search (?supabase_url=...&supabase_key=...)
    const params = new URLSearchParams(window.location.search);
    const qUrl = params.get('supabase_url');
    const qKey = params.get('supabase_key');
    if (qUrl && qKey && qUrl.startsWith('http')) {
      // Bersihkan query dari address bar
      params.delete('supabase_url');
      params.delete('supabase_key');
      const newSearch = params.toString() ? `?${params.toString()}` : '';
      window.history.replaceState(null, document.title, window.location.pathname + newSearch);
      return { url: qUrl.trim(), key: qKey.trim() };
    }
  } catch (err) {
    console.warn('Gagal membaca parameter Supabase dari URL:', err);
  }

  return null;
}

// Jalankan pengecekan URL saat pertama kali dimuat
const urlConfig = checkUrlParameters();
if (urlConfig && typeof localStorage !== 'undefined') {
  localStorage.setItem('epilketos_custom_supabase_url', urlConfig.url);
  localStorage.setItem('epilketos_custom_supabase_key', urlConfig.key);
  // Simpan juga ke server jika memungkinkan
  fetch('/api/supabase-config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(urlConfig),
  }).catch(() => {});
}

// Baca URL dan Anon Key dari Environment Variables atau LocalStorage
export function getSupabaseConfig(): SupabaseConfigState {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  if (envUrl && envKey && envUrl.startsWith('http')) {
    return {
      url: envUrl,
      key: envKey,
      isConfigured: true,
      source: 'env',
    };
  }

  if (typeof localStorage !== 'undefined') {
    const customUrl = (localStorage.getItem('epilketos_custom_supabase_url') || '').trim();
    const customKey = (localStorage.getItem('epilketos_custom_supabase_key') || '').trim();

    if (customUrl && customKey && customUrl.startsWith('http')) {
      return {
        url: customUrl,
        key: customKey,
        isConfigured: true,
        source: 'custom',
      };
    }
  }

  return {
    url: '',
    key: '',
    isConfigured: false,
    source: 'none',
  };
}

/**
 * Sinkronisasi konfigurasi dari Express Backend Server
 * Berguna saat device lain membuka aplikasi, server langsung memberikan konfigurasi cloud tersimpan
 */
export async function fetchServerSupabaseConfig(): Promise<SupabaseConfigState> {
  try {
    const res = await fetch('/api/supabase-config');
    if (res.ok) {
      const data = await res.json();
      if (data.isConfigured && data.url && data.key) {
        // Simpan ke localStorage device saat ini sebagai cache
        const current = getSupabaseConfig();
        if (current.url !== data.url || current.key !== data.key) {
          localStorage.setItem('epilketos_custom_supabase_url', data.url);
          localStorage.setItem('epilketos_custom_supabase_key', data.key);
          supabaseInstance = null; // Recreate client
        }
        return {
          url: data.url,
          key: data.key,
          isConfigured: true,
          source: data.source || 'server',
        };
      }
    }
  } catch (err) {
    console.debug('Server config endpoint not available or network error:', err);
  }
  return getSupabaseConfig();
}

export async function saveCustomSupabaseConfig(url: string, key: string): Promise<void> {
  const cleanUrl = url.trim();
  const cleanKey = key.trim();

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('epilketos_custom_supabase_url', cleanUrl);
    localStorage.setItem('epilketos_custom_supabase_key', cleanKey);
  }

  supabaseInstance = null; // Reset client agar dire-create dengan credential baru

  // Simpan juga ke Server API agar seluruh device lain otomatis terhubung
  try {
    await fetch('/api/supabase-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: cleanUrl, key: cleanKey }),
    });
  } catch (err) {
    console.warn('Gagal menyimpan konfigurasi ke backend server:', err);
  }
}

export async function clearCustomSupabaseConfig(): Promise<void> {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('epilketos_custom_supabase_url');
    localStorage.removeItem('epilketos_custom_supabase_key');
  }
  supabaseInstance = null;

  try {
    await fetch('/api/supabase-config', { method: 'DELETE' });
  } catch (err) {
    console.warn('Gagal menghapus konfigurasi di server:', err);
  }
}

/**
 * Buat tautan sinkronisasi multi-device yang dapat dibagikan atau dipindai lewat QR
 */
export function generateShareableConfigUrl(): string {
  const config = getSupabaseConfig();
  if (!config.isConfigured) return window.location.origin;

  const payload = btoa(JSON.stringify({ url: config.url, key: config.key }));
  const origin = window.location.origin;
  const path = window.location.pathname;
  return `${origin}${path}#supabase_config=${encodeURIComponent(payload)}`;
}

let supabaseInstance: SupabaseClient | null = null;
let realtimeChannel: RealtimeChannel | null = null;

export function getSupabase(): SupabaseClient | null {
  const { url, key, isConfigured } = getSupabaseConfig();

  if (!isConfigured) {
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(url, key, {
        auth: {
          persistSession: false,
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      });
    } catch (err) {
      console.warn('Inisialisasi Supabase gagal:', err);
      return null;
    }
  }

  return supabaseInstance;
}

export function isSupabaseActive(): boolean {
  return Boolean(getSupabase());
}

/**
 * Uji koneksi ke Supabase
 */
export async function testSupabaseConnection(): Promise<{
  success: boolean;
  message: string;
  details?: Record<string, number | string>;
}> {
  const client = getSupabase();
  if (!client) {
    return {
      success: false,
      message: 'Kredensial Supabase URL dan Anon Key belum dikonfigurasi.',
    };
  }

  try {
    const [schoolsRes, periodsRes, votersRes, candidatesRes] = await Promise.all([
      client.from('schools').select('id, name').limit(1),
      client.from('election_periods').select('id, period_name, status').limit(5),
      client.from('voters').select('id', { count: 'exact', head: true }),
      client.from('candidates').select('id', { count: 'exact', head: true }),
    ]);

    if (schoolsRes.error) {
      return {
        success: false,
        message: `Koneksi gagal: ${schoolsRes.error.message}. Pastikan Anda telah menjalankan skrip SQL lengkap di Supabase SQL Editor.`,
      };
    }

    const voterCount = votersRes.count ?? 0;
    const candCount = candidatesRes.count ?? 0;
    const periodCount = periodsRes.data?.length ?? 0;

    return {
      success: true,
      message: `Terhubung sukses ke Supabase Cloud! Database aktif & siap pakai.`,
      details: {
        'Data Sekolah': schoolsRes.data?.length ? schoolsRes.data[0].name : 'Belum diisi',
        'Jumlah Periode': periodCount,
        'Jumlah Paslon': candCount,
        'Jumlah DPT (Siswa)': voterCount,
      },
    };
  } catch (err) {
    return {
      success: false,
      message: `Koneksi gagal: ${(err as Error).message}`,
    };
  }
}

/**
 * Pasang listener Supabase Realtime untuk menyinkronkan data antar-perangkat secara instan
 */
export function setupRealtimeSubscription(onChange: (table: string, eventType: string) => void): () => void {
  const client = getSupabase();
  if (!client) return () => {};

  try {
    if (realtimeChannel) {
      try {
        client.removeChannel(realtimeChannel);
      } catch {
        // ignore
      }
      realtimeChannel = null;
    }

    realtimeChannel = client
      .channel('epilketos-realtime-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          console.log(`[Supabase Realtime] Perubahan terdeteksi pada tabel: ${payload.table} (${payload.eventType})`);
          onChange(payload.table, payload.eventType);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Supabase Realtime] ✅ Terhubung ke kanal realtime WebSockets Supabase.');
        } else if (status === 'CHANNEL_ERROR') {
          console.warn('[Supabase Realtime] ⚠️ Peringatan: Realtime channel error. Pastikan "supabase_realtime" publication sudah aktif.');
        }
      });

    return () => {
      if (realtimeChannel && client) {
        try {
          client.removeChannel(realtimeChannel);
        } catch {
          // ignore
        }
        realtimeChannel = null;
      }
    };
  } catch (err) {
    console.warn('Gagal memasang Supabase Realtime channel:', err);
    return () => {};
  }
}
