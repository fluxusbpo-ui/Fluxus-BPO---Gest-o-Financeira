const nodemailer = require('nodemailer');

// Read SMTP config from env
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const FROM = process.env.MAIL_FROM || 'no-reply@example.com';

let transporter = null;
if (SMTP_HOST && SMTP_PORT) {
  const portNum = Number(SMTP_PORT);
  const isSecure = portNum === 465; // 465 = SMTPS (implicit TLS)

  // For port 587 we use STARTTLS (secure: false, requireTLS: true)
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: portNum,
    secure: isSecure,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    // require TLS upgrade for submission port (587)
    requireTLS: portNum === 587,
    // Validate certificates by default, but allow opting out via MAIL_ALLOW_SELF_SIGNED=true
    tls: { rejectUnauthorized: process.env.MAIL_ALLOW_SELF_SIGNED === 'true' ? false : true },
    // Timeouts to avoid hangs when SMTP server stalls (can be overridden via env)
    connectionTimeout: Number(process.env.MAIL_CONN_TIMEOUT_MS || process.env.MAIL_TIMEOUT_MS || 10000),
    greetingTimeout: Number(process.env.MAIL_GREETING_TIMEOUT_MS || process.env.MAIL_TIMEOUT_MS || 10000),
    socketTimeout: Number(process.env.MAIL_SOCKET_TIMEOUT_MS || process.env.MAIL_TIMEOUT_MS || 10000)
  });
}

const DEFAULT_MAIL_TIMEOUT_MS = Number(process.env.MAIL_TIMEOUT_MS) || 10000;
const DEFAULT_MAIL_RETRIES = Number(process.env.MAIL_RETRIES) || 2;

async function sendMailWithRetries(mailOptions, opts = {}) {
  const timeoutMs = (opts.timeoutMs != null) ? opts.timeoutMs : DEFAULT_MAIL_TIMEOUT_MS;
  const maxRetries = (opts.retries != null) ? opts.retries : DEFAULT_MAIL_RETRIES;
  const backoffMs = (opts.backoffMs != null) ? opts.backoffMs : 500;

  let lastError = null;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (!transporter) throw new Error('No mail transporter configured');

      const sendPromise = transporter.sendMail(mailOptions);
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Mail send timeout')), timeoutMs));

      const info = await Promise.race([sendPromise, timeoutPromise]);
      return info;
    } catch (err) {
      lastError = err;
      console.error(`mailer: attempt ${attempt} failed:`, err && err.message ? err.message : err);
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, backoffMs * attempt));
      }
    }
  }

  throw lastError;
}

async function sendConfirmationEmail(to, token, opts = {}) {
  const confirmUrl = opts.confirmUrl || `http://localhost:3001/auth/confirm?token=${token}`;
  const subject = opts.subject || 'Confirme seu e-mail';
  const html = `
    <p>Olá,</p>
    <p>Por favor confirme seu e-mail clicando no link abaixo:</p>
    <p><a href="${confirmUrl}">Confirmar e-mail</a></p>
    <p>Se você não esperava este e-mail, ignore.</p>
  `;
  // Always attempt to send if transporter available, but always return the confirmUrl
  try {
    if (transporter) {
      const info = await sendMailWithRetries({ from: FROM, to, subject, html });
      // when using a real transporter, return info and the confirmUrl so callers
      // can show it to the user if needed (useful when SMTP not reachable)
      return { info, confirmUrl };
    }

    // If no real transporter and developer requested Ethereal, create a test account
    if (!transporter && (process.env.DEBUG_MAIL === 'true' || process.env.USE_ETHEREAL === 'true')) {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: { user: testAccount.user, pass: testAccount.pass },
        tls: { rejectUnauthorized: false }
      });
      const info = await sendMailWithRetries({ from: FROM, to, subject, html });
      const preview = nodemailer.getTestMessageUrl(info);
      return { info, preview, dev: true, confirmUrl };
    }

    // Dev fallback: log to console and return confirmUrl so frontend can display it
    console.log('=== EMAIL (dev mode) ===');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Confirm URL:', confirmUrl);
    console.log('========================');
    return Promise.resolve({ ok: true, dev: true, confirmUrl });
  } catch (err) {
    // ensure we still return confirmUrl even if sending failed
    console.error('Erro em sendConfirmationEmail:', err && err.message ? err.message : err);
    return Promise.resolve({ ok: false, error: String(err && err.message ? err.message : err), confirmUrl });
  }
}



// send contact form to an address
async function sendContactEmail(to, contact) {
  const subject = `Novo contato: ${contact.name} — ${contact.company}`;
  const html = `
    <h3>Novo contato enviado pelo site</h3>
    <p><strong>Nome:</strong> ${escapeHtml(contact.name)}</p>
    <p><strong>Empresa:</strong> ${escapeHtml(contact.company)}</p>
    <p><strong>CNPJ:</strong> ${escapeHtml(contact.cnpj || '')}</p>
    <p><strong>E-mail:</strong> ${escapeHtml(contact.email)}</p>
    <p><strong>Telefone:</strong> ${escapeHtml(contact.phone)}</p>
    <p><strong>Motivo:</strong> ${escapeHtml(contact.reason)}</p>
    <p><strong>Mensagem:</strong></p>
    <p>${escapeHtml(contact.message || '')}</p>
    <hr />
    <p>Recebido em: ${new Date(contact.createdAt).toLocaleString()}</p>
  `;

  // If transporter isn't configured but developer wants an easy test,
  // allow using Ethereal (createTestAccount) when DEBUG_MAIL or USE_ETHEREAL is set.
  let usedTestAccount = false;
  if (!transporter && (process.env.DEBUG_MAIL === 'true' || process.env.USE_ETHEREAL === 'true')) {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass },
      tls: { rejectUnauthorized: false }
    });
    usedTestAccount = true;
  }

  if (transporter) {
    const info = await sendMailWithRetries({ from: FROM, to, subject, html });
    if (usedTestAccount) {
      const preview = nodemailer.getTestMessageUrl(info);
      return { info, preview, dev: true };
    }
    return info;
  }

  // Dev fallback when no transporter and no Ethereal requested: log to console
  console.log('=== CONTACT EMAIL (dev mode) ===');
  console.log('To:', to);
  console.log('Subject:', subject);
  console.log(html);
  console.log('===============================');
  return Promise.resolve({ ok: true, dev: true });
}

function escapeHtml(str){
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = { sendConfirmationEmail, sendContactEmail };
module.exports.sendWelcomeEmail = async function(to, opts = {}) {
  const name = opts.name || '';
  const company = opts.company || '';
  const subject = opts.subject || `Bem-vindo à G&P Finance, ${name || ''}`;
  const html = `
    <div style="font-family: Inter, system-ui, Arial, sans-serif; color:#0f172a;">
      <div style="background:linear-gradient(90deg,#1e59d6,#2563eb);padding:24px;border-radius:8px;color:#fff;text-align:center;">
        <h2 style="margin:0;font-size:20px">Bem-vindo à G&amp;P Finance</h2>
        <p style="margin:6px 0 0;opacity:0.95">Sua jornada financeira começa agora.</p>
      </div>
      <div style="padding:18px;background:#fff;border-radius:8px;margin-top:12px;border:1px solid #eef2ff">
        <p>Olá ${escapeHtml(name)},</p>
        <p>Seja bem-vindo à <strong>G&amp;P Finance</strong>! Sua conta para a empresa <strong>${escapeHtml(company)}</strong> foi criada com sucesso no plano <strong>FREE</strong>.</p>
        <p>Aqui estão alguns passos sugeridos para começar:</p>
        <ul>
          <li>Confirme seu e-mail clicando no link que enviamos para ativar totalmente sua conta.</li>
          <li>Adicione usuários e configure suas preferências no painel.</li>
          <li>Importe suas primeiras transações para ver relatórios imediatos.</li>
        </ul>
        <p style="color:#374151;font-size:13px">Se precisar de ajuda, responda este e-mail ou visite nossa documentação.</p>
        <p style="margin-top:12px">Abraços,<br/>Equipe G&amp;P Finance</p>
      </div>
    </div>
  `;

  try {
    if (transporter) {
      return await sendMailWithRetries({ from: FROM, to, subject, html });
    }
    // fallback: if no transporter, just log and resolve
    console.log('=== WELCOME EMAIL (dev) ===');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Company:', company);
    console.log('===========================');
    return Promise.resolve({ ok: true, dev: true });
  } catch (err) {
    console.error('Erro ao enviar welcome email', err && err.message ? err.message : err);
    throw err;
  }
};

// Send a registration summary to the user (and optionally to admin)
module.exports.sendRegistrationSummary = async function(to, info = {}, opts = {}) {
  const name = info.nome || info.name || '';
  const company = info.razao_social || info.company || '';
  const cnpj = info.cnpj || '';
  const email = info.email || to;
  const telefone = info.telefone || '';
  const subject = opts.subject || `Bom dia, ${name ? name : 'bem-vindo'} — seus dados de cadastro`;

  const rows = [
    ['Nome', name],
    ['Empresa', company],
    ['CNPJ/CPF', cnpj],
    ['E-mail', email],
    ['Telefone', telefone]
  ].map(([k,v]) => `<tr><td style="padding:6px 12px;font-weight:600;border:1px solid #eef2ff">${escapeHtml(k)}</td><td style="padding:6px 12px;border:1px solid #eef2ff">${escapeHtml(v||'')}</td></tr>`).join('');

  const html = `
    <div style="font-family: Inter, system-ui, Arial, sans-serif; color:#0f172a;">
      <h3>Bom dia${name ? ' ' + escapeHtml(name) : ''}!</h3>
      <p>Segue abaixo um resumo dos dados registrados em nossa plataforma:</p>
      <table style="border-collapse:collapse;width:100%;max-width:680px">${rows}</table>
      <p style="margin-top:12px;color:#374151;font-size:13px">Se alguma informação estiver incorreta, responda a este e-mail para solicitarmos a correção.</p>
      <p>Atenciosamente,<br/>Equipe G&amp;P Finance</p>
    </div>
  `;

  try {
    if (transporter) {
      const mailOpts = { from: FROM, to, subject, html };
      // optionally send a copy to internal contact
      if (process.env.CONTACT_EMAIL) mailOpts.cc = process.env.CONTACT_EMAIL;
      return await sendMailWithRetries(mailOpts);
    }
    // dev fallback: log
    console.log('=== REGISTRATION SUMMARY (dev) ===');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Info:', info);
    console.log('==================================');
    return Promise.resolve({ ok: true, dev: true });
  } catch (err) {
    console.error('Erro ao enviar registration summary', err && err.message ? err.message : err);
    throw err;
  }
};
