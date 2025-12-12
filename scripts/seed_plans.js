const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Set SUPABASE_URL and SUPABASE_KEY (service role) in env before running.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function seed() {
  const plans = [
    {
      id: uuidv4(), nome: 'FREE', stripe_price_id: null, max_empresas: 1, max_usuarios: 2, preco_mensal: 0,
      funcionalidades: {},
      modulos: { comercial: true, compras: true, financeiro: true, conciliacao: false, relatorios_avancados: false, documentos_fiscais: false, ia_insights: false }
    },
    {
      id: uuidv4(), nome: 'ESSENCIAL', stripe_price_id: null, max_empresas: 1, max_usuarios: 3, preco_mensal: 99,
      funcionalidades: {},
      modulos: { comercial: true, compras: true, financeiro: true, conciliacao: true, relatorios_avancados: true, documentos_fiscais: true, ia_insights: false }
    },
    {
      id: uuidv4(), nome: 'PRO', stripe_price_id: null, max_empresas: 5, max_usuarios: 10, preco_mensal: 199,
      funcionalidades: {},
      modulos: { comercial: true, compras: true, financeiro: true, conciliacao: true, relatorios_avancados: true, documentos_fiscais: true, ia_insights: true }
    },
    {
      id: uuidv4(), nome: 'ENTERPRISE', stripe_price_id: null, max_empresas: 20, max_usuarios: 0, preco_mensal: 499,
      funcionalidades: {},
      modulos: { comercial: true, compras: true, financeiro: true, conciliacao: true, relatorios_avancados: true, documentos_fiscais: true, ia_insights: true, suporte_prioritario: true }
    }
  ];

  for (const p of plans) {
    const { data, error } = await supabase.from('planos').insert({
      id: p.id,
      nome: p.nome,
      stripe_price_id: p.stripe_price_id,
      max_empresas: p.max_empresas,
      max_usuarios: p.max_usuarios,
      preco_mensal: p.preco_mensal,
      funcionalidades: p.funcionalidades,
      modulos: p.modulos
    }).select().single();
    if (error) {
      console.error('Error inserting plan', p.nome, error);
    } else {
      console.log('Inserted plan', data.id, data.nome);
    }
  }
}

seed().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
