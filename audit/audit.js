// audit.js - Windows-friendly minimal audit
// Node 14+
// Requires: axios installed in this folder (npm install axios)
const fs = require('fs');
const path = require('path');
const os = require('os');
const net = require('net');

let axios;
try { axios = require('axios'); } catch (e) {
  console.error('Missing dependency: run "npm install axios --legacy-peer-deps" in this folder.');
  process.exit(1);
}

const cfg = {
  backendUrl: 'http://localhost:4000',
  frontendUrl: 'http://localhost:3000',
  prismaSchemaPath: path.join(process.cwd(), 'prisma', 'schema.prisma'),
  sqlitePaths: [
    path.join(process.cwd(), 'dev.db'),
    path.join(process.cwd(), 'prisma', 'dev.db'),
  ],
  requiredEnv: ['API_BASE', 'WORKSPACE_ID', 'DATABASE_URL', 'REDIS_URL', 'PORT'],
  ports: [4000, 3000, 6379],
  workspaceId: 'a1ae9e3a-2ff0-49f3-8e4d-f504f1332971'
};

function checkPort(port, host = '127.0.0.1', timeout = 1000) {
  return new Promise((res) => {
    const s = new net.Socket();
    let done = false;
    s.setTimeout(timeout);
    s.on('connect', () => { done = true; s.destroy(); res(true); });
    s.on('timeout', () => { if (!done) { done = true; s.destroy(); res(false); } });
    s.on('error', () => { if (!done) { done = true; res(false); } });
    s.connect(port, host);
  });
}

async function httpGet(url, timeout = 2000) {
  try {
    const r = await axios.get(url, { timeout });
    return { ok: true, status: r.status };
  } catch (e) {
    return { ok: false, error: e && e.message ? e.message : String(e) };
  }
}

function readPrismaSchema(p) {
  if (!fs.existsSync(p)) return { exists: false };
  const txt = fs.readFileSync(p, 'utf8');
  const models = Array.from(txt.matchAll(/model\s+([A-Za-z0-9_]+)/g)).map(m => m[1]);
  return { exists: true, models };
}

function checkEnv(vars) {
  const out = {};
  for (const k of vars) out[k] = !!process.env[k];
  return out;
}

async function run() {
  console.log('=== Forteresse ERP - Windows Audit ===\n');
  console.log('System:', os.type(), os.release(), os.platform());
  console.log('Node:', process.version, '\n');

  const pkgPath = path.join(process.cwd(), 'package.json');
  console.log('package.json found:', fs.existsSync(pkgPath));
  if (fs.existsSync(pkgPath)) {
    try {
      const pj = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      console.log('  name:', pj.name || '-');
      console.log('  scripts:', Object.keys(pj.scripts || {}).join(', ') || '-');
    } catch {}
  }
  console.log('');

  console.log('Ports:');
  for (const p of cfg.ports) {
    // eslint-disable-next-line no-await-in-loop
    const ok = await checkPort(p);
    console.log(`  ${p}: ${ok ? 'open' : 'closed'}`);
  }
  console.log('');

  console.log('HTTP quick checks:');
  const b = await httpGet(cfg.backendUrl);
  console.log('  Backend', cfg.backendUrl, ':', b.ok ? `UP (${b.status})` : `DOWN (${b.error})`);
  const f = await httpGet(cfg.frontendUrl);
  console.log('  Frontend', cfg.frontendUrl, ':', f.ok ? `UP (${f.status})` : `DOWN (${f.error})`);
  console.log('');

  console.log('Prisma / DB:');
  const ps = readPrismaSchema(cfg.prismaSchemaPath);
  console.log('  schema.prisma exists:', ps.exists);
  if (ps.exists) console.log('  models:', (ps.models || []).slice(0,10).join(', ') || '-');
  const dbFound = cfg.sqlitePaths.find(p => fs.existsSync(p));
  console.log('  sqlite file found:', dbFound || 'none');
  console.log('');

  console.log('Redis/Bull hint (TCP port check):');
  const rOk = await checkPort(6379);
  console.log('  redis (6379) reachable:', rOk);
  console.log('');

  console.log('Env vars:');
  const envs = checkEnv(cfg.requiredEnv);
  for (const k of Object.keys(envs)) console.log(`  ${k}: ${envs[k] ? 'set' : 'NOT SET'}`);
  console.log('');

  console.log('Workspace probe:');
  try {
    const headers = { 'x-workspace-id': cfg.workspaceId, accept: 'application/json' };
    const r = await axios.get(`${cfg.backendUrl}/api/workspace`, { headers, timeout: 1500 }).catch(()=>null);
    if (r && r.status) console.log('  /api/workspace reachable (status', r.status + ')');
    else console.log('  /api/workspace not reachable or missing');
  } catch (e) { console.log('  workspace probe error'); }
  console.log('');

  console.log('Repo heuristic scan (Node-only, cross-platform):');
  const root = process.cwd();
  const keywords = ['auth','passport','jwt','session','refresh'];
  const found = new Set();
  function walk(dir) {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const ent of entries) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        if (['node_modules','.git'].includes(ent.name)) continue;
        walk(p);
      } else {
        try {
          const txt = fs.readFileSync(p, 'utf8');
          for (const k of keywords) if (txt.includes(k)) { found.add(p); break; }
        } catch {}
      }
      if (found.size >= 20) return;
    }
  }
  walk(root);
  console.log('  auth-related files (sample):', Array.from(found).slice(0,20).join(', ') || 'none found');
  console.log('');

  console.log('=== SUMMARY ===');
  const warnings = [];
  if (!b.ok) warnings.push('backend not responding on configured port (4000)');
  if (!f.ok) warnings.push('frontend not responding on configured port (3000)');
  if (!ps.exists) warnings.push('prisma schema.prisma missing');
  if (!dbFound) warnings.push('sqlite DB file not found');
  if (!rOk) warnings.push('redis not reachable on 6379');
  if (found.size === 0) warnings.push('no obvious auth code found (heuristic)');
  if (warnings.length === 0) console.log('No immediate blocking issues detected (see details above).');
  else {
    console.log('Issues found:');
    warnings.forEach(w => console.log(' -', w));
  }
  console.log('\nAudit finished.');
}

run().catch(e => { console.error('Fatal audit error:', e); process.exit(1); });
