export const config = { runtime: 'nodejs' };
export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({
    ok: true,
    now: new Date().toISOString(),
    marker: 'runtime=nodejs',
  });
}
