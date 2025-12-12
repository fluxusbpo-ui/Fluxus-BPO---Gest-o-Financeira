// Supabase Edge Function: checkout
// POST to create a checkout session (uses Stripe if configured, otherwise returns a fake session)
import { serve } from 'https://deno.land/std@0.204.0/http/server.ts';

serve(async (req) => {
  try {
    if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const STRIPE_KEY = Deno.env.get('STRIPE_KEY');
    const body = await req.json();
    const { empresaId, planId, success_url, cancel_url } = body || {};
    if (!empresaId || !planId) return new Response(JSON.stringify({ error: 'empresaId and planId required' }), { status: 400 });

    if (STRIPE_KEY) {
      // In production, use Stripe library for secure session creation. Here we simulate minimal flow.
      // Return a placeholder URL
      const sessionId = crypto.randomUUID();
      return new Response(JSON.stringify({ ok: true, sessionUrl: `${success_url || 'https://example.com'}/session/${sessionId}`, sessionId }), { status: 200 });
    }

    // Dev fallback: fake session
    const fakeSessionId = crypto.randomUUID();
    const fakeUrl = (success_url || 'http://localhost:3001') + `/fake-checkout?session=${fakeSessionId}`;
    return new Response(JSON.stringify({ ok: true, sessionUrl: fakeUrl, sessionId: fakeSessionId }), { status: 200 });
  } catch (err) { return new Response(JSON.stringify({ error: String(err) }), { status: 500 }); }
});
