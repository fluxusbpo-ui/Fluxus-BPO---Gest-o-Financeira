const { hasPermission } = require('./roles');

// keep the old mock helper (used by some code paths) but keep permissions focused
function mockAuthFromHeaders(req, res, next) {
  const role = req.header('x-user-role');
  const id = req.header('x-user-id') || 'anonymous';
  req.user = { id, role: role || null };
  next();
}

function requirePermission(permission) {
  return function (req, res, next) {
    const role = req.user && req.user.role;
    if (!role) return res.status(401).json({ error: 'Usuário não autenticado' });
    if (hasPermission(role, permission)) return next();
    return res.status(403).json({ error: 'Acesso negado' });
  };
}

module.exports = { mockAuthFromHeaders, requirePermission };
