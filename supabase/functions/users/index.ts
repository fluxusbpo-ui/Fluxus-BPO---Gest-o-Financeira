// Supabase Edge Function: users
// GET: list users (service role restricted), POST: create user
import { serve } from 'https://deno.land/std@0.204.0/http/server.ts';
import { getEnv } from '../_env.ts';

serve(async (req) => {
  try {
    const SUPABASE_URL = getEnv('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return new Response(JSON.stringify({ error: 'Supabase not configured' }), { status: 500 });

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/usuarios`, {
        headers: { 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
      });
      const data = await resp.json();
      return new Response(JSON.stringify(data), { status: resp.ok ? 200 : 500 });
    }

    if (req.method === 'POST') {
      const payload = await req.json();
      if (!payload.nome || !payload.email) return new Response(JSON.stringify({ error: 'nome and email required' }), { status: 400 });
      payload.id = payload.id || crypto.randomUUID();
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/usuarios`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }, body: JSON.stringify([payload])
      });
      const data = await resp.json();
      if (!resp.ok) return new Response(JSON.stringify({ error: data }), { status: 500 });
      return new Response(JSON.stringify({ ok: true, data }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
