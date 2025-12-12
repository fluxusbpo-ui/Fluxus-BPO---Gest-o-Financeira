const db = require('../supabaseClient');

function parseModulos(plano) {
  if (!plano) return {};
  if (typeof plano.modulos === 'string') {
    try { return JSON.parse(plano.modulos); } catch(e){ return {}; }
  }
  return plano.modulos || {};
}

function requireModule(moduleName) {
  return async (req, res, next) => {
    try {
      const empresaId = (req.user && req.user.empresa) || req.query.empresa || req.body.empresaId || req.body.empresa_id;
      if (!empresaId) return res.status(400).json({ error: 'Empresa não informada' });

      const { data: assin, error: assinErr } = await db.from('assinaturas').select('*').eq('empresa_id', empresaId).eq('status', 'ativa').order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (assinErr) throw assinErr;
      if (!assin) return res.status(403).json({ error: 'Empresa sem assinatura ativa' });

      const { data: plano, error: planoErr } = await db.from('planos').select('*').eq('id', assin.plano_id).limit(1).maybeSingle();
      if (planoErr) throw planoErr;
      if (!plano) return res.status(403).json({ error: 'Plano não encontrado' });

      const modulos = parseModulos(plano);
      if (modulos[moduleName]) return next();
      return res.status(403).json({ error: `Módulo ${moduleName} não disponível para o plano atual` });
    } catch (err) {
      console.error('Erro requireModule', err);
      return res.status(500).json({ error: 'Erro interno' });
    }
  };
}

// Check user limit middleware
function checkUserLimit() {
  return async (req, res, next) => {
    try {
      const empresaId = req.body.empresa_id || (req.user && req.user.empresa);
      if (!empresaId) return res.status(400).json({ error: 'empresa_id requerido' });
      const { data: assin, error: assinErr } = await db.from('assinaturas').select('*').eq('empresa_id', empresaId).eq('status', 'ativa').order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (assinErr) throw assinErr;
      if (!assin) return next(); // no active plan, let other protections handle
      const { data: plano, error: planoErr } = await db.from('planos').select('*').eq('id', assin.plano_id).limit(1).maybeSingle();
      if (planoErr) throw planoErr;
      const max = plano && plano.max_usuarios ? Number(plano.max_usuarios) : 0;
      if (max === 0) return next(); // 0 = ilimitado
      const { data: usuarios, error: usuariosErr } = await db.from('usuarios').select('id').eq('empresa_id', empresaId);
      if (usuariosErr) throw usuariosErr;
      const count = usuarios ? usuarios.length : 0;
      if (count >= max) return res.status(403).json({ error: 'Limite de usuários atingido para o plano atual' });
      next();
    } catch (err) {
      console.error('Erro checkUserLimit', err);
      res.status(500).json({ error: 'Erro interno' });
    }
  };
}

// Check company limit when creating companies under a tenant
function checkCompanyLimit() {
  return async (req, res, next) => {
    try {
      const empresaOwnerId = (req.user && req.user.empresa) || req.body.owner_empresa_id || req.body.empresa_owner_id;
      // If no owner context, skip
      if (!empresaOwnerId) return next();
      // find owner's assinatura
      const { data: assin, error: assinErr } = await db.from('assinaturas').select('*').eq('empresa_id', empresaOwnerId).eq('status', 'ativa').order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (assinErr) throw assinErr;
      if (!assin) return next();
      const { data: plano, error: planoErr } = await db.from('planos').select('*').eq('id', assin.plano_id).limit(1).maybeSingle();
      if (planoErr) throw planoErr;
      const max = plano && plano.max_empresas ? Number(plano.max_empresas) : 0;
      if (max === 0) return next();
      // Count companies owned by this owner empresa
      const { data: empresas, error: empresasErr } = await db.from('empresas').select('id').eq('owner_empresa_id', empresaOwnerId);
      if (empresasErr) throw empresasErr;
      const count = empresas ? empresas.length : 0;
      if (count >= max) return res.status(403).json({ error: 'Limite de empresas atingido para o plano atual' });
      next();
    } catch (err) {
      console.error('Erro checkCompanyLimit', err);
      res.status(500).json({ error: 'Erro interno' });
    }
  };
}

module.exports = { requireModule, checkUserLimit, checkCompanyLimit };
