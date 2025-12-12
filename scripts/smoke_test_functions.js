const fetch = require('node-fetch');
const bcrypt = require('bcryptjs');

async function run(){
  const base = process.env.FUNCTIONS_BASE_URL || process.env.SUPABASE_FUNCTIONS_URL || 'http://localhost:54321';
  if (!base) { console.error('FUNCTIONS_BASE_URL not set'); process.exit(2); }
  console.log('Functions base:', base);

  // Optional auth headers for local Supabase functions (set SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY)
  const authHeaders = {};
  if (process.env.SUPABASE_ANON_KEY) authHeaders['apikey'] = process.env.SUPABASE_ANON_KEY;
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) authHeaders['Authorization'] = `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`;

  // 1) Plans
  let r = await fetch(`${base}/plans`, { headers: authHeaders });
  if (!r.ok) { console.error('plans failed', await r.text()); process.exit(3); }
  console.log('plans OK');

  // 2) Register
  const email = `dev+test+${Date.now()}@example.com`;
  const rawPassword = 'Password123!';
  const senha_hash = bcrypt.hashSync(rawPassword, 10);
  const payload = { nome: 'Smoke Test', email, senha_hash, telefone: '5511999999999' };
  r = await fetch(`${base}/register`, { method:'POST', headers: Object.assign({'Content-Type':'application/json'}, authHeaders), body: JSON.stringify(payload) });
  if (!r.ok) { console.error('register failed', await r.text()); process.exit(4); }
  const reg = await r.json().catch(()=>null);
  console.log('register OK', reg);

  // 3) Login
  r = await fetch(`${base}/login`, { method:'POST', headers: Object.assign({'Content-Type':'application/json'}, authHeaders), body: JSON.stringify({ email, senha: rawPassword }) });
  if (!r.ok) { console.error('login failed', await r.text()); process.exit(5); }
  const body = await r.json().catch(()=>null);
  console.log('login OK', body);
  // Support variations: login returning {ok, user} or direct user
  const user = (body && (body.user || body.data || body)) || null;
  const userId = (user && (user.id || (user[0] && user[0].id))) || null;

  // 4) Create company
  const comp = { razao_social: 'Smoke Co', cnpj: '00000000000191', nome_fantasia: 'Smoke', owner_empresa_id: userId || null };
  r = await fetch(`${base}/companies`, { method: 'POST', headers: Object.assign({'Content-Type':'application/json'}, authHeaders), body: JSON.stringify(comp)});
  if (!r.ok) { console.error('companies create failed', await r.text()); process.exit(6); }
  console.log('companies create OK');

  // 5) List companies for owner
  r = await fetch(`${base}/companies?owner=${userId || ''}`, { headers: authHeaders });
  if (!r.ok) { console.error('companies list failed', await r.text()); process.exit(7); }
  console.log('companies list OK');

  console.log('All smoke tests passed');
  process.exit(0);
}

run();
