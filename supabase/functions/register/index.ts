// Supabase Edge Function: register
// This is a minimal scaffold. It expects POST JSON body with { nome, email, senha_hash, telefone }
// Environment variables used: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
import { serve } from 'https://deno.land/std@0.204.0/http/server.ts';
import { getEnv } from '../_env.ts';

serve(async (req) => {
  try {
    if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    const body = await req.json();
    const { nome, email, telefone, senha_hash, role = 'master' } = body;
    if (!nome || !email) return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });

    const SUPABASE_URL = getEnv('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
    const url = `${SUPABASE_URL}/rest/v1/usuarios`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_ROLE_KEY || '',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY || ''}`
      },
      body: JSON.stringify([{ id: crypto.randomUUID(), nome, email, telefone, senha_hash, role }])
    });
    const text = await resp.text().catch(()=>'');
    let data = null;
    try { if (text) data = JSON.parse(text); } catch(e) { data = text; }
    if (!resp.ok) return new Response(JSON.stringify({ error: data || 'PostgREST error' }), { status: 500 });
    return new Response(JSON.stringify({ ok: true, data }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
