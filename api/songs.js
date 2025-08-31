import { list } from '@vercel/blob';

export const config = { runtime: 'edge' };

export default async function handler(req) {
  // Cho phép CORS để gọi từ web khác
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization'
      }
    });
  }

  try {
    // Lấy danh sách file trong Blob store (prefix "music/")
    const { blobs } = await list({ prefix: 'music/' });

    // Chỉ lọc file nhạc
    const tracks = blobs.filter(b => /\.(mp3|m4a|wav)$/i.test(b.pathname));

    const results = tracks.map((t, idx) => ({
      id: (idx + 1).toString().padStart(3, '0'),
      title: decodeURIComponent(t.pathname.split('/').pop().replace(/\.(mp3|m4a|wav)$/i, '')),
      artist: '',
      duration: null,
      artwork: null,
      stream_url: t.url
    }));

    return new Response(JSON.stringify(results), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}
