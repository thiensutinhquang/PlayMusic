import { list } from '@vercel/blob';

export const config = { runtime: 'nodejs20.x' };

const AUDIO_RE = /\.(mp3|m4a|wav)$/i;
const FALLBACK_ARTIST = 'minhsutinhquang';

function inferTitle(pathname) {
  let base = pathname.split('/').pop() || '';
  base = base.replace(AUDIO_RE, '');
  return decodeURIComponent(base).replace(/[_-]+/g, ' ').trim() || 'Untitled';
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
    // LIỆT KÊ TRONG THƯ MỤC music/
    const { blobs } = await list({
      prefix: 'music/',
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    const byPath = new Map(blobs.map(b => [b.pathname, b]));
    const audio = blobs
      .filter(b => AUDIO_RE.test(b.pathname))
      .sort((a, b) => a.pathname.localeCompare(b.pathname, 'en', { numeric: true }));

    const out = [];

    for (let i = 0; i < audio.length; i++) {
      const t = audio[i];
      const base = t.pathname.replace(AUDIO_RE, '');

      // Artwork cùng tên (nếu có)
      const artwork =
        byPath.get(`${base}.jpg`)?.url ||
        byPath.get(`${base}.png`)?.url ||
        byPath.get(`${base}.webp`)?.url ||
        null;

      // Mặc định
      let title = inferTitle(t.pathname);
      let artist = FALLBACK_ARTIST;
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
            const d = Number(m.duration);
            if (Number.isFinite(d)) duration = d;
          }
        } catch {
          // bỏ qua lỗi đọc metadata
        }
      }

      out.push({
        id: String(i + 1).padStart(3, '0'),
        title,
        artist,
        duration,
        artwork,
        stream_url: t.url
      });
    }

    // ÉP fallback lần cuối (không thể còn '')
    const final = out.map(s => ({
      ...s,
      artist: s.artist && s.artist.trim() ? s.artist.trim() : FALLBACK_ARTIST
    }));

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    // tránh cache khi đang debug
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json(final);
  } catch (e) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ error: e?.message || 'Internal Error' });
  }
}
