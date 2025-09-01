import { list, put } from '@vercel/blob';
import { parseStream } from 'music-metadata';
import { Readable } from 'node:stream';

export const config = { runtime: 'nodejs' };

const AUDIO_RE = /\.(mp3|m4a|wav)$/i;
const RANGE_BYTES = 2_000_000;      // đọc ~2MB đầu để lấy lyrics nhúng
const WRITE_BACK_LYRICS = true;     // ghi file .lrc/.txt khi trích được lyrics
const PREFIX = 'music/';            // thay đổi nếu bạn muốn

function normPath(p) {
  try {
    p = decodeURIComponent(p || '').trim();
  } catch {}
  if (!p || !AUDIO_RE.test(p) || !p.startsWith(PREFIX) || p.includes('..')) return null;
  return p;
}
function basePath(p) { return p.replace(AUDIO_RE, ''); }

function parseLRC(text) {
  const rx = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?](.*)/g;
  const out = [];
  let m;
  while ((m = rx.exec(text)) !== null) {
    const mm = +m[1], ss = +m[2], ms = +(m[3] || 0);
    const t = mm * 60 + ss + ms / (m[3]?.length === 3 ? 1000 : 100);
    out.push({ time: t, text: m[4].trim() });
  }
  return out.sort((a, b) => a.time - b.time);
}

async function readRangeAndParse(url) {
  const res = await fetch(url, { headers: { Range: `bytes=0-${RANGE_BYTES - 1}` } });
  if (!res.ok || !res.body) return {};
  const mime = res.headers.get('content-type') || undefined;
  const stream = Readable.fromWeb(res.body);
  const md = await parseStream(stream, { mimeType: mime });
  // USLT (unsynchronised lyrics)
  const lyrics = Array.isArray(md?.common?.lyrics) && md.common.lyrics.length
    ? md.common.lyrics.join('\n')
    : null;
  return { lyrics };
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
    const q = new URL(req.url, 'http://x').searchParams;
    const path = normPath(q.get('path'));
    if (!path) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(400).json({ ok: false, error: 'Invalid path. Expect ?path=music/<name>.mp3' });
    }
    const base = basePath(path);
    const folder = base.slice(0, base.lastIndexOf('/') + 1);

    // List trong thư mục chứa file (đỡ phải list cả store)
    const { blobs } = await list({ prefix: folder, token: process.env.BLOB_READ_WRITE_TOKEN });
    const byPath = new Map(blobs.map(b => [b.pathname, b]));

    // 1) Nếu có sidecar LRC/TXT
    const lrcBlob = byPath.get(`${base}.lrc`);
    const txtBlob = byPath.get(`${base}.txt`);
    if (lrcBlob || txtBlob) {
      const b = lrcBlob || txtBlob;
      const r = await fetch(b.url);
      const content = await r.text();
      const type = lrcBlob ? 'lrc' : 'txt';
      const lines = type === 'lrc' ? parseLRC(content) : null;
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).json({ ok: true, path, type, content, lines });
    }

    // 2) Không có → thử đọc lyrics nhúng trong .mp3
    const audioBlob = byPath.get(path);
    if (!audioBlob) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(404).json({ ok: false, error: 'Audio blob not found in folder.' });
    }

    const { lyrics } = await readRangeAndParse(audioBlob.url);
    if (lyrics) {
      // Ghi lại để cache lần sau
      if (WRITE_BACK_LYRICS) {
        try {
          await put(`${base}.txt`, lyrics, {
            access: 'public',
            contentType: 'text/plain; charset=utf-8',
            token: process.env.BLOB_READ_WRITE_TOKEN
          });
        } catch {}
      }
      res.setHeader('Access-Control-Allow-Origin', '*');
      return res.status(200).json({ ok: true, path, type: 'txt', content: lyrics, lines: null });
    }

    // 3) Không tìm thấy lời
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ ok: true, path, type: 'none', content: '', lines: null });
  } catch (e) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ ok: false, error: e?.message || 'Internal Error' });
  }
}
