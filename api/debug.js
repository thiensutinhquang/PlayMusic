export const config = { runtime: 'nodejs20.x' };
export default function handler(req, res){
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({
    ok: true,
    now: new Date().toISOString(),
    env: !!process.env.BLOB_READ_WRITE_TOKEN,
    note: 'This proves which deployment you hit.',
    marker: 'FALLBACK_ARTIST=minhsutinhquang'
  });
}
