function requireRole(...roles) {
  return (req, res, next) => {
    const userRole = req.user && req.user.role;
    if (!userRole) return res.status(401).json({ error: 'Usuário não autenticado' });
    if (!roles.includes(userRole) && userRole !== 'master') {
      return res.status(403).json({ error: 'Acesso negado' });
    }
    next();
  };
}

module.exports = { requireRole };
