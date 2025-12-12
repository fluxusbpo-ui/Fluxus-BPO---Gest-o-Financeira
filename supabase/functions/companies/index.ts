// Supabase Edge Function: companies
// Supports GET (list) and POST (create). Uses service role key to perform DB writes.
import { serve } from 'https://deno.land/std@0.204.0/http/server.ts';
import { getEnv } from '../_env.ts';

serve(async (req) => {
  try {
    const SUPABASE_URL = getEnv('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return new Response(JSON.stringify({ error: 'Supabase not configured' }), { status: 500 });

    if (req.method === 'GET') {
      const url = new URL(req.url);
      const owner = url.searchParams.get('owner');
      let qs = '';
      if (owner) qs = `?owner_empresa_id=eq.${encodeURIComponent(owner)}`;
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/empresas${qs}`, {
        headers: { 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
      });
      const data = await resp.json();
      return new Response(JSON.stringify(data), { status: resp.ok ? 200 : 500 });
    }

    if (req.method === 'POST') {
      const body = await req.json();
      if (!body.razao_social || !body.cnpj) return new Response(JSON.stringify({ error: 'razao_social and cnpj required' }), { status: 400 });
      const payload = [{
        id: body.id || crypto.randomUUID(),
        razao_social: body.razao_social,
        cnpj: String(body.cnpj).replace(/\D/g,''),
        telefone: body.telefone || null,
        email: body.email || null,
        owner_empresa_id: body.owner_empresa_id || null,
        data: body.data || null
      }];
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/empresas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` },
        body: JSON.stringify(payload)
      });
      const text = await resp.text().catch(()=>'');
      let data = null;
      try { if (text) data = JSON.parse(text); } catch(e) { data = text; }
      if (!resp.ok) return new Response(JSON.stringify({ error: data || 'PostgREST error' }), { status: 500 });
      return new Response(JSON.stringify({ ok: true, data }), { status: 200 });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
