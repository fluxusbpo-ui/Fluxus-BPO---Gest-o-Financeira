const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const { v4: uuidv4 } = require('uuid');
const db = require('./supabaseClient');
const bcrypt = require('bcryptjs');
const authController = require('./controllers/auth.controller');
// removed jwt usage now using Supabase Auth for sessions
const { sendConfirmationEmail, sendContactEmail } = require('./mailer');
const { mockAuthFromHeaders, requirePermission } = require('./permissions');
const { requireRole } = require('./middleware/role.middleware');
const { PERMISSIONS, ROLES } = require('./roles');

const port = process.env.PORT || 5000;

// middleware
app.use(express.json());


// Register-free route delegates to the auth controller (uses Supabase Auth + registration emails)
app.post('/auth/register-free', express.json(), authController.register);
app.post('/auth/register', express.json(), authController.register);

// Confirmar e-mail
app.get('/auth/confirm', async (req, res) => {
  const { token } = req.query || {};
  if (!token) return res.status(400).send('Token requerido');
  try {
    const { data: row, error: rowErr } = await db.from('email_tokens').select('*').eq('token', token).eq('used', false).limit(1).maybeSingle();
    if (rowErr) throw rowErr;
    if (!row) return res.status(400).send('Token inválido ou já usado');
    if (row.expires_at && new Date(row.expires_at) < new Date()) return res.status(400).send('Token expirado');

    // marcar usuário confirmado e token usado
    const { error: uerr } = await db.from('usuarios').update({ email_confirmed: true }).eq('id', row.user_id);
    if (uerr) throw uerr;
    const { error: terr } = await db.from('email_tokens').update({ used: true }).eq('id', row.id);
    if (terr) throw terr;

    // buscar empresa para redirecionar para escolher plano
    const { data: user, error: userErr } = await db.from('usuarios').select('*').eq('id', row.user_id).limit(1).maybeSingle();
    if (userErr) throw userErr;
    const empresa = user ? user.empresa_id : null;
    const frontend = process.env.FRONTEND_URL || 'http://localhost:3001';
    // redirect to choose plan page with empresa id
    return res.redirect(`${frontend}/choose-plan.html?empresa=${empresa}&token=${token}`);
  } catch (err) {
    console.error('Erro confirmando token', err);
    return res.status(500).send('Erro interno');
  }
});

// Auth routes
app.post('/auth/login', express.json(), authController.login);

// ---------- Exemplo de rotas protegidas por permissões ----------

// Criar empresa (apenas usuários com permissão de gerenciar empresas) - verifica limite por plano
const { requireModule, checkUserLimit, checkCompanyLimit } = require('./middleware/plan.middleware');
// Form to create a new empresa (simple HTML page that posts JSON via fetch)
app.get('/companies/new', (req, res) => {
  const html = '<!doctype html>' +
  '<html>' +
  '<head>' +
    '<meta charset="utf-8" />' +
    '<meta name="viewport" content="width=device-width,initial-scale=1" />' +
    '<title>Adicionar Empresa</title>' +
    '<style>body{font-family:Segoe UI,Roboto,Helvetica,Arial;margin:18px;max-width:860px}label{display:block;margin-top:10px;font-weight:600}input,textarea,select{width:100%;padding:8px;margin-top:6px;border:1px solid #dfe7f3;border-radius:6px;box-sizing:border-box}fieldset{border:1px solid #eef4fc;padding:12px;border-radius:8px;margin-top:12px}legend{font-weight:700}button{margin-top:12px;padding:10px 14px;background:#1b6fd8;color:#fff;border:none;border-radius:6px;cursor:pointer}pre{background:#f7fbff;padding:10px;border-radius:6px;border:1px solid #e6f2ff}</style>' +
  '</head>' +
  '<body>' +
    '<h2>Cadastro de Empresa</h2>' +
    '<form id="companyForm">' +
      '<fieldset><legend>Identificação</legend>' +
        '<label>CNPJ (somente números)<input name="cnpj" required placeholder="Ex: 12345678000195" /></label>' +
        '<label>Razão Social<input name="razao_social" required /></label>' +
        '<label>Nome Fantasia<input name="nome_fantasia" /></label>' +
        '<label>Porte<select name="porte"><option value="">-- selecione --</option><option value="micro">Micro</option><option value="pequena">Pequena</option><option value="media">Média</option><option value="grande">Grande</option></select></label>' +
      '</fieldset>' +
      '<fieldset><legend>Atividades</legend>' +
        '<label>CÓDIGO - Atividade Econômica Principal (código)<input name="atividade_principal_codigo" /></label>' +
        '<label>DESCRIÇÃO - Atividade Econômica Principal<input name="atividade_principal_descricao" /></label>' +
        '<label>CÓDIGO E DESCRIÇÃO DAS ATIVIDADES ECONÔMICAS SECUNDÁRIAS (texto livre)<textarea name="atividades_secundarias" rows="4" placeholder="Informe códigos e descrições separadas por vírgula ou nova linha"></textarea></label>' +
        '<label>CÓDIGO - Natureza Jurídica<input name="natureza_juridica_codigo" /></label>' +
        '<label>DESCRIÇÃO - Natureza Jurídica<input name="natureza_juridica_descricao" /></label>' +
      '</fieldset>' +
      '<fieldset><legend>Endereço</legend>' +
        '<label>CEP<input name="cep" /></label>' +
        '<label>Logradouro<input name="logradouro" /></label>' +
        '<label>Número<input name="numero" /></label>' +
        '<label>Complemento<input name="complemento" /></label>' +
        '<label>Bairro<input name="bairro" /></label>' +
        '<label>Município<input name="municipio" /></label>' +
        '<label>UF<input name="uf" maxlength="2" /></label>' +
      '</fieldset>' +
      '<fieldset><legend>Contato</legend>' +
        '<label>Telefone<input name="telefone" /></label>' +
        '<label>Email<input name="email" type="email" /></label>' +
      '</fieldset>' +
      '<button type="submit">Criar Empresa</button>' +
    '</form>' +
    '<pre id="result" style="margin-top:12px"></pre>' +
    '<script>' +
      '(function(){' +
        'const form = document.getElementById("companyForm");' +

        '// Auto-complete via /api/cnpj when CNPJ is filled (on blur)\n' +
        'const cnpjInput = form.querySelector("input[name=\"cnpj\"]");' +
        'if (cnpjInput) {' +
          'cnpjInput.addEventListener("blur", async function(){' +
            'try {' +
              'const raw = String(cnpjInput.value || "").replace(/\D/g,"");' +
              'if (!raw || raw.length !== 14) return;' +
              'document.getElementById("result").textContent = "Buscando CNPJ...";' +
              'const resp = await fetch("/api/cnpj/" + raw);' +
              'if (!resp.ok) { document.getElementById("result").textContent = "CNPJ não encontrado"; return; }' +
              'const body = await resp.json();' +
              'const d = body.data || body || {};' +
              '// Map common fields to our form inputs (best-effort)\n' +
              'if (d.nome) { const el = form.querySelector("input[name=\"razao_social\"]"); if (el) el.value = d.nome; }' +
              'if (d.fantasia) { const el = form.querySelector("input[name=\"nome_fantasia\"]"); if (el) el.value = d.fantasia; }' +
              '// atividade principal (array or object)\n' +
              'if (d.atividade_principal && Array.isArray(d.atividade_principal) && d.atividade_principal[0]) {' +
                'const ap = d.atividade_principal[0];' +
                'const code = ap.code || ap.codigo || ap.cnae || ap.codeActivity || "";' +
                'const text = ap.text || ap.descricao || ap.name || "";' +
                'const c1 = form.querySelector("input[name=\"atividade_principal_codigo\"]"); if (c1) c1.value = code;' +
                'const c2 = form.querySelector("input[name=\"atividade_principal_descricao\"]"); if (c2) c2.value = text;' +
              '} else if (d.atividade_principal_codigo) {' +
                'const c1 = form.querySelector("input[name=\"atividade_principal_codigo\"]"); if (c1) c1.value = d.atividade_principal_codigo;' +
                'const c2 = form.querySelector("input[name=\"atividade_principal_descricao\"]"); if (c2) c2.value = d.atividade_principal_descricao || "";' +
              '}' +
              '// atividades secundárias\n' +
              'if (d.atividades_secundarias) {' +
                'const ta = form.querySelector("textarea[name=\"atividades_secundarias\"]");' +
                'if (ta) {' +
                  'if (Array.isArray(d.atividades_secundarias)) {' +
                    'ta.value = d.atividades_secundarias.map(a => (a.code||a.codigo||a.cnae? (a.code||a.codigo||a.cnae)+" - ":"") + (a.text||a.descricao||a)).join("\n");' +
                  '} else { ta.value = String(d.atividades_secundarias); }' +
                '}' +
              '}' +
              '// natureza jurídica\n' +
              'if (d.natureza_juridica) {' +
                'const el = form.querySelector("input[name=\"natureza_juridica_descricao\"]"); if (el) el.value = d.natureza_juridica; }' +
              '// endereço\n' +
              'if (d.cep) { const e = form.querySelector("input[name=\"cep\"]"); if (e) e.value = String(d.cep).replace(/\D/g,""); }' +
              'if (d.logradouro) { const e=form.querySelector("input[name=\"logradouro\"]"); if (e) e.value = d.logradouro; }' +
              'if (d.numero) { const e=form.querySelector("input[name=\"numero\"]"); if (e) e.value = d.numero; }' +
              'if (d.complemento) { const e=form.querySelector("input[name=\"complemento\"]"); if (e) e.value = d.complemento; }' +
              'if (d.bairro) { const e=form.querySelector("input[name=\"bairro\"]"); if (e) e.value = d.bairro; }' +
              'if (d.municipio) { const e=form.querySelector("input[name=\"municipio\"]"); if (e) e.value = d.municipio; }' +
              'if (d.uf) { const e=form.querySelector("input[name=\"uf\"]"); if (e) e.value = d.uf; }' +
              '// contato\n' +
              'if (d.telefone) { const e=form.querySelector("input[name=\"telefone\"]"); if (e) e.value = d.telefone; }' +
              'if (d.email) { const e=form.querySelector("input[name=\"email\"]"); if (e) e.value = d.email; }' +
              'document.getElementById("result").textContent = "";' +
            '} catch(err) {' +
              'document.getElementById("result").textContent = "Erro ao buscar CNPJ: " + (err && err.message ? err.message : err);' +
            '}' +
          '});' +
        '}' +

        'form.addEventListener("submit", async function(e){' +
          'e.preventDefault();' +
          'const fd = new FormData(form); const data = {};' +
          'fd.forEach((v,k)=> data[k]=v && v.trim ? v.trim() : v);' +
          '// normalize CNPJ and CEP to digits only' +
          'if (data.cnpj) data.cnpj = String(data.cnpj).replace(/\D/g,"");' +
          'if (data.cep) data.cep = String(data.cep).replace(/\D/g,"");' +
          'const headers = {"Content-Type":"application/json"};' +
          'try{ const token = window.localStorage && window.localStorage.getItem("jwt"); if (token) headers["Authorization"] = "Bearer "+token }catch(e){}' +
          'const resp = await fetch("/api/companies", { method: "POST", headers, body: JSON.stringify(data) });' +
          'const txt = await resp.text();' +
          'document.getElementById("result").textContent = "HTTP "+resp.status+"\n"+txt;' +
        '});' +
      '})();' +
    '</script>' +
  '</body>' +
  '</html>';
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

app.post('/api/companies', requirePermission(PERMISSIONS.MANAGE_COMPANIES), checkCompanyLimit(), async (req, res) => {
  // Accept extended empresa payload and store extra fields in a JSON/text `data` column (created if absent)
  const body = req.body || {};
  const {
    razao_social, cnpj, telefone, email, nome_fantasia, porte,
    atividade_principal_codigo, atividade_principal_descricao,
    atividades_secundarias, natureza_juridica_codigo, natureza_juridica_descricao,
    cep, logradouro, numero, complemento, bairro, municipio, uf
  } = body;

  if (!razao_social || !cnpj) return res.status(400).json({ error: 'Campos obrigatórios: razao_social, cnpj' });
  const id = uuidv4();
  try {
    // normalize CNPJ digits
    const digits = String(cnpj || '').replace(/\D/g, '');
    const { data: exist, error: existErr } = await db.from('empresas').select('*').eq('cnpj', digits).limit(1).maybeSingle();
    if (existErr) throw existErr;
    if (exist) return res.status(400).json({ error: 'CNPJ já cadastrado' });

    // prepare main columns (existing schema)
    const newEmp = { id, razao_social, cnpj: digits, telefone: telefone || null, email: email || null };
    try {
      const ownerId = (req.user && req.user.empresa) || null;
      if (ownerId) newEmp.owner_empresa_id = ownerId;
    } catch(e) { /* ignore */ }

    // prepare extra payload
    const extra = {
      nome_fantasia: nome_fantasia || null,
      porte: porte || null,
      atividade_principal: {
        codigo: atividade_principal_codigo || null,
        descricao: atividade_principal_descricao || null
      },
      atividades_secundarias: atividades_secundarias || null,
      natureza_juridica: {
        codigo: natureza_juridica_codigo || null,
        descricao: natureza_juridica_descricao || null
      },
      endereco: { cep: cep || null, logradouro: logradouro || null, numero: numero || null, complemento: complemento || null, bairro: bairro || null, municipio: municipio || null, uf: uf || null }
    };

    // Collect any additional fields (e.g. billing_*, delivery*_*) and attach under extra.additional
    try {
      const knownKeys = new Set([
        'razao_social','cnpj','telefone','email','nome_fantasia','porte',
        'atividade_principal_codigo','atividade_principal_descricao','atividades_secundarias',
        'natureza_juridica_codigo','natureza_juridica_descricao','cep','logradouro','numero','complemento','bairro','municipio','uf'
      ]);
      const additional = {};
      for (const k of Object.keys(body || {})) {
        if (!knownKeys.has(k)) additional[k] = body[k];
      }
      if (Object.keys(additional).length) extra.additional = additional;
    } catch(e) { /* ignore */ }

    // attach extra JSON as text (migration should add this column)
    newEmp.data = JSON.stringify(extra);

    const { data: insertedEmpresa, error: insertEmpErr } = await db.from('empresas').insert(newEmp).select().single();
    if (insertEmpErr) throw insertEmpErr;
    // if a user performed the creation, and their usuario record has no empresa_id, link it
    try {
        if (req.user && req.user.id) {
          const { data: userRow, error: userRowErr } = await db.from('usuarios').select('*').eq('id', req.user.id).limit(1).maybeSingle();
          if (userRowErr) throw userRowErr;
          if (userRow) {
            const { error: upErr } = await db.from('usuarios').update({ empresa_id: id }).eq('id', req.user.id);
            if (upErr) throw upErr;
          }
      }
    } catch(e) {
      console.warn('Não foi possível vincular empresa ao usuário criador:', e && e.message ? e.message : e);
    }

    res.json({ ok: true, id });
  } catch (err) {
    console.error('Erro ao criar empresa', err);
    res.status(500).json({ error: 'Erro ao criar empresa' });
  }
});

// Remover empresa (apenas master/admin conforme permissão)
const { validateUuidParam } = require('./middleware/validate.middleware');

app.delete('/api/companies/:id', validateUuidParam('id'), requirePermission(PERMISSIONS.MANAGE_COMPANIES), async (req, res) => {
  const { id } = req.params;
  try {
    const { error: delErr } = await db.from('empresas').delete().eq('id', id);
    if (delErr) throw delErr;
    res.json({ ok: true });
  } catch (err) {
    console.error('Erro ao deletar empresa', err);
    res.status(500).json({ error: 'Erro ao deletar empresa' });
  }
});

// Listar empresas (retorna empresas do owner quando disponível)
app.get('/api/companies', async (req, res) => {
  try {
    const ownerId = (req.user && req.user.empresa) || null;
    const selectFields = ['id','razao_social','cnpj','telefone','email','active','owner_empresa_id'];
    let q = db.from('empresas').select(selectFields.join(','));
    if (ownerId) q = q.eq('owner_empresa_id', ownerId);
    const { data: rows, error: rowsErr } = await q;
    if (rowsErr) throw rowsErr;
    res.json(rows);
  } catch (err) {
    console.error('Erro listando empresas', err);
    res.status(500).json({ error: 'Erro listando empresas' });
  }
});

// Operação em massa para empresas: inativar ou excluir
app.post('/api/companies/bulk', requirePermission(PERMISSIONS.MANAGE_COMPANIES), express.json(), async (req, res) => {
  const { ids, action } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'ids array requerido' });
  if (!action || (action !== 'inactivate' && action !== 'delete')) return res.status(400).json({ error: 'action inválida (inactivate|delete)' });

  try {
    if (action === 'inactivate') {
      // ensure active column exists
      try {
        const { error: updErr } = await db.from('empresas').update({ active: false }).in('id', ids);
        if (updErr) throw updErr;
      } catch(e) { console.warn('Falha garantindo coluna active:', e && e.message); }
      return res.json({ ok: true, action: 'inactivate', count: ids.length });
    }

    // delete action: remove empresa and related data (usuarios, assinaturas)
    if (action === 'delete') {
      // remove assinaturas relacionadas
      try { const { error: err1 } = await db.from('assinaturas').delete().in('empresa_id', ids); if (err1) console.warn('Erro ao deletar assinaturas relacionadas', err1); } catch(e) { console.warn('Erro ao deletar assinaturas relacionadas', e && e.message); }
      // remove usuarios relacionados
      try { const { error: err2 } = await db.from('usuarios').delete().in('empresa_id', ids); if (err2) console.warn('Erro ao deletar usuarios relacionados', err2); } catch(e) { console.warn('Erro ao deletar usuarios relacionados', e && e.message); }
      // finally remove empresas
      const { error: err3 } = await db.from('empresas').delete().in('id', ids);
      if (err3) throw err3;
      return res.json({ ok: true, action: 'delete', count: ids.length });
    }

    res.status(400).json({ error: 'Ação não tratada' });
  } catch (err) {
    console.error('Erro em bulk companies', err);
    res.status(500).json({ error: 'Erro ao executar operação em massa' });
  }
});

// Obter empresa por id
app.get('/api/companies/:id', validateUuidParam('id'), async (req, res) => {
  const { id } = req.params;
  try {
    const { data: row, error: rowErr } = await db.from('empresas').select('*').eq('id', id).limit(1).maybeSingle();
    if (rowErr) throw rowErr;
    if (!row) return res.status(404).json({ error: 'Empresa não encontrada' });
    res.json(row);
  } catch (err) {
    console.error('Erro obtenção empresa', err);
    res.status(500).json({ error: 'Erro obtendo empresa' });
  }
});

// Atualizar empresa (campos principais e dados adicionais). Permite também marcar active/inactive via payload { active: false }
app.put('/api/companies/:id', validateUuidParam('id'), requirePermission(PERMISSIONS.MANAGE_COMPANIES), async (req, res) => {
  const { id } = req.params;
  const body = req.body || {};
  try {
    const { data: row, error: rowErr } = await db.from('empresas').select('*').eq('id', id).limit(1).maybeSingle();
    if (rowErr) throw rowErr;
    if (!row) return res.status(404).json({ error: 'Empresa não encontrada' });

    const update = {};
    // allow updating these main fields
    if (body.razao_social) update.razao_social = body.razao_social;
    if (body.telefone !== undefined) update.telefone = body.telefone || null;
    if (body.email !== undefined) update.email = body.email || null;
    if (body.cnpj) update.cnpj = String(body.cnpj).replace(/\D/g,'');

    // handle 'active' flag - assume column exists in migration
    if (body.active !== undefined) {
      update.active = !!body.active;
    }

    // handle data (JSON) updates: merge existing data JSON with provided body.data if present
    if (body.data !== undefined) {
      try {
        let existing = {};
        if (row.data) {
          try { existing = typeof row.data === 'string' ? JSON.parse(row.data) : row.data; } catch(e) { existing = {}; }
        }
        const merged = Object.assign({}, existing, body.data || {});
        update.data = JSON.stringify(merged);
      } catch(e) { console.warn('Erro ao atualizar data:', e && e.message); }
    }

    if (Object.keys(update).length === 0) return res.status(400).json({ error: 'Nenhum campo para atualizar' });

    const { error: updateErr } = await db.from('empresas').update(update).eq('id', id);
    if (updateErr) throw updateErr;
    res.json({ ok: true });
  } catch (err) {
    console.error('Erro ao atualizar empresa', err);
    res.status(500).json({ error: 'Erro ao atualizar empresa' });
  }
});

// Criar usuário: admin pode criar usuários exceto 'master'
app.post('/api/users', requireRole(ROLES.ADMIN, ROLES.MASTER), checkUserLimit(), async (req, res) => {
  const { empresa_id, nome, email, telefone, senha_hash, role } = req.body || {};
  if (!empresa_id || !nome || !email || !role) return res.status(400).json({ error: 'Campos obrigatórios: empresa_id, nome, email, role' });
  // admin não pode criar master
  if (role === ROLES.MASTER && req.user.role !== ROLES.MASTER) {
    return res.status(403).json({ error: 'Apenas MASTER pode criar usuário MASTER' });
  }
  const id = uuidv4();
  try {
    const { data: newUser, error: newUserErr } = await db.from('usuarios').insert({ id, empresa_id, nome, email, telefone, senha_hash, role }).select().single();
    if (newUserErr) throw newUserErr;
    res.json({ ok: true, id });
  } catch (err) {
    console.error('Erro ao criar usuário', err);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

// Alterar status de usuário (apenas MASTER pode alterar qualquer usuário)
app.put('/api/users/:id/status', requirePermission(PERMISSIONS.CHANGE_USER_STATUS_ANY), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};
  if (!status) return res.status(400).json({ error: 'Status requerido' });
  try {
    const { error: statusErr } = await db.from('usuarios').update({ status }).eq('id', id);
    if (statusErr) throw statusErr;
    res.json({ ok: true });
  } catch (err) {
    console.error('Erro ao atualizar status', err);
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
});

// Exemplo: rota financeira acessível apenas para role financeiro
app.get('/api/financeiro/reports', requirePermission(PERMISSIONS.FINANCEIRO_ACCESS), (req, res) => {
  res.json({ ok: true, msg: 'Acesso a relatórios financeiros' });
});

// Exemplo: rota comercial
app.get('/api/comercial/dashboard', requirePermission(PERMISSIONS.COMERCIAL_ACCESS), (req, res) => {
  res.json({ ok: true, msg: 'Dashboard comercial' });
});

function isValidEmail(email){
  return typeof email === 'string' && /\S+@\S+\.\S+/.test(email);
}

app.post('/api/contact', async (req, res) => {
  const { name, company, cnpj, email, phone, reason, message } = req.body || {};
  if (!name || !company || !email || !phone) {
    return res.status(400).json({ error: 'Campos obrigatórios: name, company, email, phone' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Email inválido' });
  }

  const entry = {
    id: Date.now(),
    name: String(name),
    company: String(company),
    cnpj: cnpj ? String(cnpj) : null,
    email: String(email),
    phone: String(phone),
    reason: reason ? String(reason) : 'Outros',
    message: message ? String(message) : null,
    createdAt: new Date().toISOString()
  };

  try {
    const raw = fs.readFileSync(contactsFile, 'utf8');
    const arr = JSON.parse(raw);
    arr.push(entry);
    fs.writeFileSync(contactsFile, JSON.stringify(arr, null, 2));
    console.log('Novo contato:', entry);
    // attempt to send email to consultant
    try {
      const mailRes = await sendContactEmail(process.env.CONTACT_EMAIL || 'consultororganizado@gmail.com', entry);
      if (process.env.DEBUG_MAIL === 'true') {
        // when debugging, return mail result so developer can see preview URL/info
        return res.json({ ok: true, mail: mailRes });
      }
    } catch (mailErr) {
      console.error('Erro ao enviar email de contato:', mailErr);
      // continue — do not fail the request because of email issues
    }
    res.json({ ok: true });
  } catch (err) {
    console.error('Erro ao salvar contato', err);
    res.status(500).json({ error: 'Erro ao salvar contato' });
  }
});

// Helper: simple GET JSON with timeout using native http/https
const http = require('http');
const https = require('https');
const { URL } = require('url');

function fetchJsonWithTimeout(rawUrl, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    let urlObj;
    try { urlObj = new URL(rawUrl); } catch (err) { return reject(new Error('URL inválida')) }

    const lib = urlObj.protocol === 'https:' ? https : http;
    const req = lib.get(urlObj, { timeout: timeoutMs, headers: { 'User-Agent': 'gp-finance/1.0' } }, (res) => {
      const { statusCode } = res;
      let raw = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => raw += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(raw);
          if (statusCode >= 400) return reject(new Error(`HTTP ${statusCode}`));
          resolve(parsed);
        } catch (e) {
          // sometimes API returns plain text
          if (statusCode >= 400) return reject(new Error(`HTTP ${statusCode}`));
          try { resolve(JSON.parse(raw || '{}')); } catch(_) { resolve({ raw }); }
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

// Rota para consultar CNPJ (consulta um serviço público como receitaws)
app.get('/api/cnpj/:cnpj', async (req, res) => {
  try {
    const raw = String(req.params.cnpj || '');
    const digits = raw.replace(/\D/g, '');
    if (digits.length !== 14) return res.status(400).json({ error: 'CNPJ inválido (aguarda 14 dígitos)' });

    // usar receitaws (limite de requisições público) — o backend atua como proxy para evitar CORS
    const url = `https://www.receitaws.com.br/v1/cnpj/${digits}`;
    const timeoutMs = parseInt(process.env.CNPJ_LOOKUP_TIMEOUT_MS || '8000', 10);
    const data = await fetchJsonWithTimeout(url, timeoutMs);

    // receitaws returns 'status' with 'ERROR' or data fields; forward useful fields
    if (data && data.status && data.status.toLowerCase() === 'error') {
      return res.status(502).json({ error: data.message || 'Erro na consulta externa', details: data });
    }

    // Normalize response into a shape the frontend expects (multiple possible keys)
    const normalized = {};
    normalized.nome = data.nome || data.razao_social || null;
    normalized.razao_social = normalized.nome;
    normalized.fantasia = data.fantasia || data.nome_fantasia || null;
    normalized.nome_fantasia = normalized.fantasia;
    normalized.email = data.email || null;
    normalized.telefone = data.telefone || data.telefones || null;
    normalized.telefones = Array.isArray(data.telefones) ? data.telefones : (data.telefone ? [data.telefone] : []);
    normalized.contato = {
      nome: (data.responsavel || data.contato || null),
      telefone: data.telefone || null,
      email: data.email || null
    };
    normalized.data_abertura = data.abertura || data.data_abertura || null;
    normalized.porte = data.porte || null;
    normalized.situacao = data.situacao || data.situacao_cadastral || null;
    // natureza juridica
    if (data.natureza_juridica){
      if (typeof data.natureza_juridica === 'object') normalized.natureza_juridica = data.natureza_juridica;
      else normalized.natureza_juridica = { descricao: data.natureza_juridica };
    } else {
      normalized.natureza_juridica = null;
    }
    // CNAE / atividades
    if (data.atividade_principal){
      // receitaws returns object with code/text or array
      normalized.atividade_principal = data.atividade_principal;
    } else if (data.atividades && data.atividades.length){
      normalized.atividade_principal = data.atividades[0];
    }
    normalized.atividades_secundarias = data.atividades_secundarias || data.atividades || [];

    // endereco mapping (prefer nested estabelecimento if present)
    const end = data.estabelecimento || data.estabelecimentos && data.estabelecimentos[0] || data;
    normalized.endereco = {
      cep: (end.cep || data.cep || '').replace(/\D/g,'') || null,
      logradouro: end.logradouro || end['logradouro'] || data.logradouro || null,
      numero: end.numero || data.numero || null,
      complemento: end.complemento || data.complemento || null,
      bairro: end.bairro || data.bairro || null,
      municipio: end.municipio || end.cidade || data.municipio || data.cidade || null,
      uf: (end.uf || data.uf || null)
    };

    return res.json({ ok: true, source: 'receitaws', data: normalized, raw: data });
  } catch (err) {
    console.error('Erro ao consultar CNPJ', err && err.message ? err.message : err);
    return res.status(500).json({ error: 'Falha ao consultar CNPJ', details: String(err && err.message ? err.message : err) });
  }
});

app.listen(port, () => {
  console.log(`Backend iniciado na porta ${port}`);
});
