// Placeholder para configuração Stripe
// Se tiver STRIPE_SECRET_KEY em env, inicializa aqui.
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  const Stripe = require('stripe');
  stripe = Stripe(process.env.STRIPE_SECRET_KEY);
}
module.exports = stripe;
