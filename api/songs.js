import { list, put } from '@vercel/blob';
import { parseStream } from 'music-metadata';
import { Readable } from 'node:stream';

export const config = { runtime: 'nodejs' };

const AUDIO_RE = /\.(mp3|m4a|wav)$/i;
const FALLBACK_ARTIST = 'minhsutinhquang';
const WRITE_BACK_META = true;        // true: tự tạo/ghi *.json sau khi suy ra duration
const RANGE_BYTES = 2_000_000;       // đọc ~2MB đầu để suy ra duration
const CONCURRENCY = 3;               // giới hạn số file xử lý song song

function inferTitle(pathname) {
  let base = pathname.split('/').pop() || '';
  base = base.replace(AUDIO_RE, '');
  return decodeURIComponent(base).replace(/[_-]+/g, ' ').trim() || 'Untitled';
}

async function probeDuration(url, mimeHint) {
  try {
    const res = await fetch(url, { headers: { Range: `bytes=0-${RANGE_BYTES - 1}` } });
    if (!res.ok || !res.body) return null;
    const mime = mimeHint || res.headers.get('content-type') || undefined;
    const nodeStream = Readable.fromWeb(res.body);
    const md = await parseStream(nodeStream, { mimeType: mime });
    const dur = md?.format?.duration;
    return Number.isFinite(dur) ? Math.round(dur) : null;
  } catch {
    return null;
  }
}

async function withLimit(items, limit, worker) {
  const out = new Array(items.length);
  let i = 0, running = 0;
  return new Promise((resolve) => {
    const next = () => {
      if (i >= items.length && running === 0) return resolve(out);
      while (running < limit && i < items.length) {
        const idx = i++;
        running++;
        Promise.resolve(worker(items[idx], idx))
          .then(v => out[idx] = v)
          .catch(() => out[idx] = undefined)
          .finally(() => { running--; next(); });
      }
    };
    next();
  });
}

export default async function handler(req, res) {
  // CORS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    return res.status(204).end();
  }

  try {
    // Duyệt các file trong thư mục 'music/' của Blob store
    const { blobs } = await list({
      prefix: 'music/',
      token: process.env.BLOB_READ_WRITE_TOKEN   // có thể bỏ nếu store đã Connect Project
    });

    const byPath = new Map(blobs.map(b => [b.pathname, b]));
    const tracks = blobs
      .filter(b => AUDIO_RE.test(b.pathname))
      .sort((a, b) => a.pathname.localeCompare(b.pathname, 'en', { numeric: true }));

    const results = await withLimit(tracks, CONCURRENCY, async (t, i) => {
      const base = t.pathname.replace(AUDIO_RE, '');
      const id = String(i + 1).padStart(3, '0');

      const artwork =
        byPath.get(`${base}.jpg`)?.url ||
        byPath.get(`${base}.png`)?.url ||
        byPath.get(`${base}.webp`)?.url || null;

      let title = inferTitle(t.pathname);
      let artist = FALLBACK_ARTIST;
      let duration = null;

      // 1) Metadata JSON cạnh file (nếu có)
      const metaBlob = byPath.get(`${base}.json`);
      if (metaBlob) {
        try {
          const r = await fetch(metaBlob.url);
          if (r.ok) {
            const m = await r.json();
            if (typeof m.title === 'string' && m.title.trim()) title = m.title.trim();
            if (typeof m.artist === 'string' && m.artist.trim()) artist = m.artist.trim();
            const d = Number(m.duration);
            if (Number.isFinite(d)) duration = d;
          }
        } catch {}
      }

      // 2) Nếu chưa có duration → phân tích stream để lấy duration
      if (!Number.isFinite(duration)) {
        duration = await probeDuration(t.url);
        // 3) Ghi lại *.json để cache lần sau (tuỳ chọn)
        if (WRITE_BACK_META && duration) {
          try {
            await put(
              `${base}.json`,
              JSON.stringify({ title, artist, duration }),
              { access: 'public', contentType: 'application/json', token: process.env.BLOB_READ_WRITE_TOKEN }
            );
          } catch {}
        }
      }

      // đảm bảo artist không rỗng
      artist = artist?.trim() || FALLBACK_ARTIST;

      return {
        id, title, artist,
        duration: Number.isFinite(duration) ? duration : null,
        artwork,
        stream_url: t.url
      };
    });

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store'); // đổi sang max-age=60 khi ổn định
    return res.status(200).json(results);
  } catch (e) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ error: e?.message || 'Internal Error' });
  }
}
