// /api/songs.js  (Serverless Node.js)
import { list } from '@vercel/blob';

export const config = {
  runtime: 'nodejs18.x' // hoặc 'nodejs20.x' nếu project bạn là Node 20
};

export default async function handler(req, res) {
  // CORS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    return res.status(204).end();
  }

  try {
    // Nếu store private, truyền token; public thì cũng OK khi có token
    const { blobs } = await list({
      prefix: 'music/',
      token: process.env.BLOB_READ_WRITE_TOKEN
    });

    const tracks = blobs.filter(b => /\.(mp3|m4a|wav)$/i.test(b.pathname));

    const results = tracks.map((t, idx) => ({
      id: String(idx + 1).padStart(3, '0'),
      title: decodeURIComponent(t.pathname.split('/').pop().replace(/\.(mp3|m4a|wav)$/i, '')),
      artist: '',
      duration: null,
      artwork: null,
      stream_url: t.url
    }));

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).send(JSON.stringify(results));
  } catch (e) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ error: e?.message || 'Internal Error' });
  }
}
