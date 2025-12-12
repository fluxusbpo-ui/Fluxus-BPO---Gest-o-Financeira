const { v4: uuidv4 } = require('uuid');
const db = require('../supabaseClient');
const stripe = require('../config/stripe');

async function listPlans(req, res) {
  try {
    const { data: planos, error } = await db.from('planos').select('*');
    if (error) throw error;
    res.json({ ok: true, planos });
  } catch (err) {
    console.error('Erro listando planos', err);
    res.status(500).json({ error: 'Erro interno' });
  }
}

async function createCheckoutSession(req, res) {
  const { empresaId, planId, success_url, cancel_url } = req.body || {};
  if (!empresaId || !planId) return res.status(400).json({ error: 'empresaId e planId requeridos' });

  try {
    const { data: planoData, error } = await db.from('planos').select('*').eq('id', planId).limit(1).maybeSingle();
    if (error) throw error;
    const plano = planoData;
    if (!plano) return res.status(404).json({ error: 'Plano não encontrado' });

    // If Stripe configured, create a Checkout session
    if (stripe) {
      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: plano.stripe_price_id, quantity: 1 }],
        success_url: success_url || (process.env.FRONTEND_URL || 'http://localhost:3001') + '/success.html?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: cancel_url || (process.env.FRONTEND_URL || 'http://localhost:3001') + '/cancel.html'
      });
      // Persist a pending assinatura record and store session id for mapping in webhook
      const assinId = uuidv4();
      const { error: insertErr } = await db.from('assinaturas').insert({ id: assinId, empresa_id: empresaId, plano_id: planId, stripe_subscription_id: null, checkout_session_id: session.id, status: 'pendente', inicio: null, fim: null });
      if (insertErr) throw insertErr;
      return res.json({ ok: true, sessionUrl: session.url, sessionId: session.id });
    }

    // Dev fallback: simulate a session URL
    const fakeSessionId = uuidv4();
    const fakeUrl = (process.env.FRONTEND_URL || 'http://localhost:3001') + `/fake-checkout?session=${fakeSessionId}`;
    const assinId = uuidv4();
    const { error: insertErr2 } = await db.from('assinaturas').insert({ id: assinId, empresa_id: empresaId, plano_id: planId, stripe_subscription_id: null, checkout_session_id: fakeSessionId, status: 'pendente', inicio: null, fim: null });
    if (insertErr2) throw insertErr2;
    return res.json({ ok: true, sessionUrl: fakeUrl, sessionId: fakeSessionId });
  } catch (err) {
    console.error('Erro criando session', err);
    res.status(500).json({ error: 'Erro interno' });
  }
}

// Webhook handler: accepts real Stripe webhook or a dev-friendly JSON payload
async function handleWebhook(req, res) {
  try {
    if (stripe && process.env.STRIPE_WEBHOOK_SECRET) {
      const sig = req.headers['stripe-signature'];
      let event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
      } catch (err) {
        console.error('Signature verification failed', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
      // handle relevant event types
      if (event.type === 'invoice.payment_succeeded' || event.type === 'checkout.session.completed' || event.type === 'customer.subscription.created') {
        const data = event.data.object;
        // attempt to find subscription id
        const stripeSubscriptionId = data.subscription || data.id || null;
        // Attempt to map to our pending assinatura by stripe_subscription_id or other logic
        // For robust handling, store mapping when session was created.
        // Here we try to find assinaturas with matching stripe_subscription_id
        if (stripeSubscriptionId) {
          const { data: assin, error: assinErr } = await db.from('assinaturas').select('*').eq('stripe_subscription_id', stripeSubscriptionId).limit(1).maybeSingle();
          if (assinErr) throw assinErr;
          if (assin) {
            const { error: updateErr } = await db.from('assinaturas').update({ status: 'ativa', inicio: new Date(), stripe_subscription_id: stripeSubscriptionId }).eq('id', assin.id);
            if (updateErr) throw updateErr;
            const { error: updateEmpresaErr } = await db.from('empresas').update({ active: true }).eq('id', assin.empresa_id);
            if (updateEmpresaErr) throw updateEmpresaErr;
          }
        }
      }
      return res.json({ received: true });
    }

    // Dev fallback: expect JSON body with { event:'subscription_activated', stripe_subscription_id, plan_id, empresa_id }
    const body = req.body || {};
    if (body.event === 'subscription_activated') {
      const { stripe_subscription_id, plan_id, empresa_id } = body;
      const assinId = uuidv4();
      const { error: insertErr3 } = await db.from('assinaturas').insert({ id: assinId, empresa_id, plano_id: plan_id, stripe_subscription_id, status: 'ativa', inicio: new Date(), fim: null });
      if (insertErr3) throw insertErr3;
      const { error: updateEmpresaErr2 } = await db.from('empresas').update({ active: true }).eq('id', empresa_id);
      if (updateEmpresaErr2) throw updateEmpresaErr2;
      return res.json({ ok: true });
    }

    res.status(400).json({ error: 'Evento desconhecido' });
  } catch (err) {
    console.error('Erro no webhook', err);
    res.status(500).json({ error: 'Erro interno' });
  }
}

module.exports = { listPlans, createCheckoutSession, handleWebhook };
