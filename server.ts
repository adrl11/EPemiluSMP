import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();

app.use(express.json({ limit: '15mb' }));

// Helper membaca konfigurasi Supabase tersimpan
const getConfigFilePath = () => path.join(process.cwd(), 'supabase-config.json');

// API 1: GET Supabase Configuration
app.get('/api/supabase-config', (req, res) => {
  const envUrl = (process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
  const envKey = (process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').trim();

  if (envUrl && envKey && envUrl.startsWith('http')) {
    return res.json({ url: envUrl, key: envKey, isConfigured: true, source: 'env' });
  }

  const filePath = getConfigFilePath();
  if (fs.existsSync(filePath)) {
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.key && parsed.url.startsWith('http')) {
        return res.json({ url: parsed.url, key: parsed.key, isConfigured: true, source: 'server' });
      }
    } catch (err) {
      console.warn('Gagal membaca supabase-config.json:', err);
    }
  }

  return res.json({ url: '', key: '', isConfigured: false, source: 'none' });
});

// API 2: POST Supabase Configuration
app.post('/api/supabase-config', (req, res) => {
  const { url, key } = req.body || {};
  if (!url || !key) {
    return res.status(400).json({ error: 'Project URL dan Anon Key Supabase wajib diisi.' });
  }

  const trimmedUrl = String(url).trim();
  const trimmedKey = String(key).trim();

  if (!trimmedUrl.startsWith('http')) {
    return res.status(400).json({ error: 'URL Supabase harus diawali dengan https://' });
  }

  try {
    const filePath = getConfigFilePath();
    fs.writeFileSync(
      filePath,
      JSON.stringify({ url: trimmedUrl, key: trimmedKey, updated_at: new Date().toISOString() }, null, 2)
    );

    process.env.VITE_SUPABASE_URL = trimmedUrl;
    process.env.VITE_SUPABASE_ANON_KEY = trimmedKey;

    return res.json({
      success: true,
      message: 'Konfigurasi Supabase berhasil disimpan di server dan dibagikan ke seluruh perangkat.',
    });
  } catch (err) {
    return res.status(500).json({ error: `Gagal menyimpan konfigurasi di server: ${(err as Error).message}` });
  }
});

// API 3: DELETE Supabase Configuration
app.delete('/api/supabase-config', (req, res) => {
  try {
    const filePath = getConfigFilePath();
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    delete process.env.VITE_SUPABASE_URL;
    delete process.env.VITE_SUPABASE_ANON_KEY;
    return res.json({ success: true, message: 'Konfigurasi Supabase di server berhasil direset.' });
  } catch (err) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// API 4: Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'E-Pilketos Cloud Bridge', timestamp: new Date().toISOString() });
});

// Bagian ini HANYA jalan saat development lokal atau di server tradisional
// (bukan Vercel). Di Vercel, file ini diimpor sebagai serverless function
// lewat vercel.json, jadi app.listen() TIDAK dipanggil di sana.
async function startLocalServer() {
  const PORT = 3000;

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`E-Pilketos Server running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startLocalServer();
}

// Vercel mengimpor 'app' ini langsung sebagai serverless function handler.
export default app;