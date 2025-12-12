// Inicializa o cliente Supabase
// Instale: npm install @supabase/supabase-js
const { createClient } = require('@supabase/supabase-js');

// Configure SUPABASE_URL (ex.: https://pykshzedlcmzrutzqnpg.supabase.co)
// Configure SUPABASE_KEY (service role key or anon key) — prefer service role for server-side
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://pykshzedlcmzrutzqnpg.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn('Supabase não configurado. Defina SUPABASE_URL e SUPABASE_KEY / SUPABASE_SERVICE_ROLE_KEY / SUPABASE_ANON_KEY');
}

const supabase = createClient(SUPABASE_URL || '', SUPABASE_KEY || '');

module.exports = supabase;

// Observação: substitua as chamadas do knex nos modelos por chamadas ao supabase.
// Exemplos:
// const { data, error } = await supabase.from('usuarios').select('*').eq('id', id).single();
