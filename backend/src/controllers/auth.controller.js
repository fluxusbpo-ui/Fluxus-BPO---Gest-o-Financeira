const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const db = require('../supabaseClient');
const usuarioModel = require('../models/usuario.model');
const mailer = require('../config/mailer');
const { ROLES } = require('../roles');

async function register(req, res) {
  const { razao_social, cnpj, nome_responsavel, telefone, email, senha, confirmar_senha } = req.body || {};
  if (!razao_social || !cnpj || !nome_responsavel || !email || !senha || !confirmar_senha) {
    return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
  }
  if (senha !== confirmar_senha) return res.status(400).json({ error: 'Senhas não conferem' });

  const digits = (cnpj || '').toString().replace(/\D/g, '');
  if (![11,14].includes(digits.length)) {
    return res.status(400).json({ error: 'CNPJ/CPF inválido (esperado 11 ou 14 dígitos)'});
  }

  try {
    const existing = await usuarioModel.findByEmail(email);
    if (existing) return res.status(400).json({ error: 'Email já cadastrado' });

    // Create user in Supabase Auth (signUp) which will send confirmation email if configured.
    const { data: signUpData, error: signUpError } = await db.auth.signUp({ email, password: senha }, { data: { nome: nome_responsavel, telefone } });
    if (signUpError) return res.status(400).json({ error: signUpError.message || 'Erro ao criar usuário' });
    const userId = signUpData.user && signUpData.user.id ? signUpData.user.id : uuidv4();
    // Insert user in usuarios table with supabase auth id
    const senha_hash = bcrypt.hashSync(senha, 10);

    await usuarioModel.createUsuario({ id: userId, nome: nome_responsavel, email, telefone, senha_hash, role: ROLES.MASTER, email_confirmed: false });

    // generate email confirmation token and persist (used by /auth/confirm)
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + (1000 * 60 * 60 * 24)); // 24h
    const { error: tokenErr } = await db.from('email_tokens').insert({ id: uuidv4(), user_id: userId, token, expires_at: expiresAt });
    if (tokenErr) console.warn('Não foi possível criar token de confirmação:', tokenErr);

    // send confirmation email (will log in dev if SMTP not configured)
    const mailRes = await mailer.sendConfirmationEmail(email, token, { confirmUrl: process.env.CONFIRM_URL || `http://localhost:3001/auth/confirm?token=${token}` });
    try { await mailer.sendRegistrationSummary(email, { razao_social, cnpj, nome: nome_responsavel, telefone, email }); } catch(e){ /* ignore */ }

    // Return Supabase session data if present
    const jwtToken = signUpData && signUpData.session ? signUpData.session.access_token : null;
    return res.json({ ok: true, userId, jwt: jwtToken, mail: mailRes && mailRes.dev ? { confirmUrl: mailRes.confirmUrl } : null });
  } catch (err) {
    console.error('Erro no register', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
}

module.exports = { register };

async function login(req, res) {
  const { email, senha } = req.body || {};
  if (!email || !senha) return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  try {
    // Use Supabase auth for login
    const { data: signInData, error: signInError } = await db.auth.signInWithPassword({ email, password: senha });
    if (signInError) return res.status(400).json({ error: signInError.message || 'Credenciais inválidas' });
    const token = signInData && signInData.session ? signInData.session.access_token : null;
    return res.json({ ok: true, token });
  } catch (err) {
    console.error('Erro login', err);
    res.status(500).json({ error: 'Erro interno' });
  }
}

module.exports.login = login;
