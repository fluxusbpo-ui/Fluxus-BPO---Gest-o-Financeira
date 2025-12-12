// Supabase Edge Function: login
// Minimal scaffold: expects { email, senha } and returns user record if password matches
import { serve } from 'https://deno.land/std@0.204.0/http/server.ts';
import bcrypt from 'npm:bcryptjs';
import { getEnv } from '../_env.ts';

serve(async (req) => {
  try {
    if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    const body = await req.json();
    const { email, senha } = body;
    if (!email || !senha) return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });

    const SUPABASE_URL = getEnv('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
    const url = `${SUPABASE_URL}/rest/v1/usuarios?email=eq.${encodeURIComponent(email)}`;
    const resp = await fetch(url, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY || '',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY || ''}`
      }
    });
    const users = await resp.json();
    const user = users && users[0];
    if (!user) return new Response(JSON.stringify({ error: 'Credenciais inválidas' }), { status: 400 });
    const ok = bcrypt.compareSync(senha, user.senha_hash || '');
    if (!ok) return new Response(JSON.stringify({ error: 'Credenciais inválidas' }), { status: 400 });
    return new Response(JSON.stringify({ ok: true, user }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
