// Supabase Edge Function: plans
// Returns available plans. Uses service role key to read the 'planos' table.
import { serve } from 'https://deno.land/std@0.204.0/http/server.ts';
import { getEnv } from '../_env.ts';

serve(async (req) => {
  try {
    const SUPABASE_URL = getEnv('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = getEnv('SUPABASE_SERVICE_ROLE_KEY');
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return new Response(JSON.stringify({ error: 'Supabase not configured' }), { status: 500 });
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/planos`, {
      headers: { 'apikey': SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }
    });
    const data = await resp.json();
    return new Response(JSON.stringify(data), { status: resp.ok ? 200 : 500 });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
