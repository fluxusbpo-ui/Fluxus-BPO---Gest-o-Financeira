const { validate: isUuid } = require('uuid');

function validateUuidParam(paramName) {
  return (req, res, next) => {
    const val = req.params && req.params[paramName];
    if (!val) return res.status(400).json({ error: `${paramName} requerido` });
    if (!isUuid(val)) return res.status(400).json({ error: `${paramName} inválido (esperado UUID)` });
    next();
  };
}

module.exports = { validateUuidParam };
