import { list, put } from '@vercel/blob';
import { parseStream } from 'music-metadata';
import { Readable } from 'node:stream';

export const config = { runtime: 'nodejs' };

const AUDIO_RE = /\.(mp3|m4a|wav)$/i;
const FALLBACK_ARTIST = 'minhsutinhquang';
const RANGE_BYTES = 2_000_000;   // đọc ~2MB đầu; tăng nếu cần bắt ảnh bìa lớn
const CONCURRENCY = 3;           // giới hạn xử lý song song
const WRITE_BACK_META    = true; // ghi *.json (title/artist/duration)
const WRITE_BACK_LYRICS  = true; // ghi *.lrc hoặc *.txt
const WRITE_BACK_ARTWORK = true; // ghi *.jpg/png/webp

function inferTitle(pathname) {
  let base = pathname.split('/').pop() || '';
  base = base.replace(AUDIO_RE, '');
  return decodeURIComponent(base).replace(/[_-]+/g, ' ').trim() || 'Untitled';
}

async function probeHead(url) {
  const res = await fetch(url, { headers: { Range: `bytes=0-${RANGE_BYTES - 1}` } });
  if (!res.ok || !res.body) return {};
  const mime = res.headers.get('content-type') || undefined;
  const stream = Readable.fromWeb(res.body);
  const md = await parseStream(stream, { mimeType: mime });

  const duration = Number.isFinite(md?.format?.duration) ? Math.round(md.format.duration) : null;
  const picture  = md?.common?.picture?.[0] || null;                          // { format, data }
  const lyrics   = Array.isArray(md?.common?.lyrics) && md.common.lyrics.length
    ? md.common.lyrics.join('\n')
    : null; // (USLT). SYLT bạn có thể map sau nếu cần timecode.

  return { duration, picture, lyrics };
}

async function withLimit(items, limit, worker) {
  const out = new Array(items.length);
  let i = 0, running = 0;
  return new Promise(resolve => {
    const next = () => {
      if (i >= items.length && running === 0) return resolve(out);
      while (running < limit && i < items.length) {
        const idx = i++; running++;
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
    // Duyệt trong thư mục music/ (đổi nếu muốn quét toàn store)
    const { blobs } = await list({ prefix: 'music/', token: process.env.BLOB_READ_WRITE_TOKEN });
    const byPath = new Map(blobs.map(b => [b.pathname, b]));

    const tracks = blobs
      .filter(b => AUDIO_RE.test(b.pathname))
      .sort((a, b) => a.pathname.localeCompare(b.pathname, 'en', { numeric: true }));

    const results = await withLimit(tracks, CONCURRENCY, async (t, i) => {
      const base = t.pathname.replace(AUDIO_RE, '');
      const id   = String(i + 1).padStart(3, '0');

      // --- Sidecar artwork/lyrics đã có sẵn?
      let artwork =
        byPath.get(`${base}.jpg`)?.url ||
        byPath.get(`${base}.png`)?.url ||
        byPath.get(`${base}.webp`)?.url || null;

      let lyrics = null;
      const lrcBlob = byPath.get(`${base}.lrc`) || byPath.get(`${base}.txt`);
      if (lrcBlob) {
        try { const r = await fetch(lrcBlob.url); if (r.ok) lyrics = await r.text(); } catch {}
      }

      // --- Metadata mặc định
      let title    = inferTitle(t.pathname);
      let artist   = FALLBACK_ARTIST;
      let duration = null;

      // --- Sidecar JSON?
      const metaBlob = byPath.get(`${base}.json`);
      if (metaBlob) {
        try {
          const r = await fetch(metaBlob.url);
          if (r.ok) {
            const m = await r.json();
            if (m.title?.trim())  title  = m.title.trim();
            if (m.artist?.trim()) artist = m.artist.trim();
            const d = Number(m.duration);
            if (Number.isFinite(d)) duration = d;
          }
        } catch {}
      }

      // --- Thiếu info → trích từ .mp3 bằng music-metadata
      if (!Number.isFinite(duration) || !artwork || !lyrics) {
        const { duration: dur2, picture, lyrics: lyr2 } = await probeHead(t.url);
        if (!Number.isFinite(duration) && Number.isFinite(dur2)) duration = dur2;

        // Artwork nhúng
        if (!artwork && picture && WRITE_BACK_ARTWORK) {
          try {
            const mime = picture.format || 'image/jpeg';
            const ext  = (mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : 'jpg');
            const path = `${base}.${ext}`;
            const putRes = await put(path, Buffer.from(picture.data), {
              access: 'public',
              contentType: mime,
              token: process.env.BLOB_READ_WRITE_TOKEN
            });
            artwork = putRes.url;
          } catch {}
        }

        // Lyrics nhúng (USLT)
        if (!lyrics && lyr2 && WRITE_BACK_LYRICS) {
          try {
            const path = `${base}.lrc`; // hoặc .txt
            const putRes = await put(path, lyr2, {
              access: 'public',
              contentType: 'text/plain; charset=utf-8',
              token: process.env.BLOB_READ_WRITE_TOKEN
            });
            lyrics = lyr2; // và đã có file để lần sau đọc nhanh
          } catch {}
        }

        // Ghi lại *.json (cache) nếu cần
        if (WRITE_BACK_META && !metaBlob) {
          try {
            await put(`${base}.json`, JSON.stringify({
              title, artist,
              duration: Number.isFinite(duration) ? duration : undefined
            }), {
              access: 'public',
              contentType: 'application/json',
              token: process.env.BLOB_READ_WRITE_TOKEN
            });
          } catch {}
        }
      }

      artist = artist?.trim() || FALLBACK_ARTIST;

      return {
        id, title, artist,
        duration: Number.isFinite(duration) ? duration : null,
        artwork,
        stream_url: t.url,
        // Trả lyrics text; nếu muốn gọn payload, bạn có thể bỏ field này và làm /api/lyrics riêng.
        lyrics: lyrics || null
      };
    });

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).json(results);
  } catch (e) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ error: e?.message || 'Internal Error' });
  }
}

