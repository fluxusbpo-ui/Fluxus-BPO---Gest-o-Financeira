const supabase = require('../supabaseClient');

// Middleware de autenticação: verifica token supabase se presente, senão aceita headers de dev
async function auth(req, res, next) {
  const authHeader = req.header('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data || !data.user) return res.status(401).json({ error: 'Token inválido' });
      req.user = { id: data.user.id, role: data.user.user_metadata && data.user.user_metadata.role ? data.user.user_metadata.role : data.user.role, empresa: data.user.user_metadata && data.user.user_metadata.empresa ? data.user.user_metadata.empresa : null };
      return next();
    } catch (err) {
      return res.status(401).json({ error: 'Token inválido' });
    }
  }
  // fallback dev: allow x-user-role header and x-user-id
  const role = req.header('x-user-role');
  const id = req.header('x-user-id') || null;
  req.user = { id, role: role || null };
  next();
}

module.exports = { auth };
