// /api/songs.js
import { list } from '@vercel/blob';

export const config = { runtime: 'nodejs20.x' }; // Serverless Node runtime

function inferTitle(pathname) {
  let base = pathname.split('/').pop() || '';
  base = base.replace(/\.(mp3|m4a|wav)$/i, '');
  return decodeURIComponent(base).replace(/[_-]+/g, ' ').trim() || 'Untitled';
}

export default async function handler(req, res) {
  // CORS (cho GitHub Pages / domain khác gọi API này)
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    return res.status(204).end();
  }

  try {
    // KHÔNG dùng prefix: lấy toàn bộ blob trong store
    const { blobs } = await list({ token: process.env.BLOB_READ_WRITE_TOKEN });

    const byPath = new Map(blobs.map(b => [b.pathname, b]));
    const AUDIO_RE = /\.(mp3|m4a|wav)$/i;

    // Chọn file nhạc ở mọi thư mục, sắp xếp theo tên
    const audio = blobs
      .filter(b => AUDIO_RE.test(b.pathname))
      .sort((a, b) => a.pathname.localeCompare(b.pathname, 'en', { numeric: true }));

    const out = [];
    for (let i = 0; i < audio.length; i++) {
      const t = audio[i];
      const base = t.pathname.replace(AUDIO_RE, '');
      const id = String(i + 1).padStart(3, '0');

      // Artwork: cùng tên .jpg / .png / .webp (nếu có)
      const artwork =
        byPath.get(`${base}.jpg`)?.url ||
        byPath.get(`${base}.png`)?.url ||
        byPath.get(`${base}.webp`)?.url ||
        null;

      // Mặc định
      let title = inferTitle(t.pathname);
      let artist = 'minhsutinhquang';
      let duration = null;

      // Metadata JSON cùng tên (tùy chọn)
      const metaBlob = byPath.get(`${base}.json`);
      if (metaBlob) {
        try {
          const r = await fetch(metaBlob.url);
          if (r.ok) {
            const m = await r.json();
            if (typeof m.title === 'string' && m.title.trim()) title = m.title.trim();
            if (typeof m.artist === 'string' && m.artist.trim()) artist = m.artist.trim();
            if (typeof m.duration === 'number') duration = m.duration;
            else if (typeof m.duration === 'string' && m.duration.trim()) {
              const n = Number(m.duration);
              if (Number.isFinite(n)) duration = n;
            }
          }
        } catch { /* bỏ qua lỗi đọc metadata */ }
      }

      out.push({
        id,
        title,
        artist,
        duration,       // giây; client sẽ tự lấy từ metadata nếu null
        artwork,
        stream_url: t.url
      });
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=60');
    return res.status(200).send(JSON.stringify(out));
  } catch (e) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ error: e?.message || 'Internal Error' });
  }
}
