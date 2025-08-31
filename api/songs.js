import { list } from '@vercel/blob';
export const config = { runtime: 'nodejs20.x' };

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    return res.status(204).end();
  }

  try {
    // KHÔNG dùng prefix để lấy tất cả blob
    const { blobs } = await list({ token: process.env.BLOB_READ_WRITE_TOKEN });

    const map = new Map(blobs.map(b => [b.pathname, b]));
    const audio = blobs.filter(b => /\.(mp3|m4a|wav)$/i.test(b.pathname));

    const out = audio.map((t, i) => {
      const base = t.pathname.replace(/\.(mp3|m4a|wav)$/i, '');
      const art = map.get(`${base}.jpg`)?.url || map.get(`${base}.png`)?.url || null;
      return {
        id: String(i + 1).padStart(3, '0'),
        title: decodeURIComponent(t.pathname.split('/').pop().replace(/\.(mp3|m4a|wav)$/i, '')),
        artist: '',
        duration: null,
        artwork: art,
        stream_url: t.url
      };
    });

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(JSON.stringify(out));
  } catch (e) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ error: e?.message || 'Internal Error' });
  }
}
