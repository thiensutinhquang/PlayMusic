import { list } from '@vercel/blob';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    return res.status(204).end();
  }

  try {
    const { blobs } = await list({
      prefix: 'music/',
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    const tracks = blobs.filter(b => /\.(mp3|m4a|wav)$/i.test(b.pathname));

    const results = tracks.map((t, i) => ({
      id: String(i + 1).padStart(3, '0'),
      title: decodeURIComponent(t.pathname.split('/').pop().replace(/\.(mp3|m4a|wav)$/i, '')),
      artist: '',
      duration: null,
      artwork: null,
      stream_url: t.url
    }));

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(JSON.stringify(results));
  } catch (e) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ error: e?.message || 'Internal Error' });
  }
}
