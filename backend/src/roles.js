// Definições de roles e permissões para o Bloco 2
const ROLES = {
  MASTER: 'master',
  ADMIN: 'admin',
  FINANCEIRO: 'financeiro',
  COMERCIAL: 'comercial',
  COMPRAS: 'compras'
};

// Permissões nominais (strings usadas pelo middleware)
const PERMISSIONS = {
  MANAGE_SYSTEM: 'manage_system',
  MANAGE_COMPANIES: 'manage_companies',
  MANAGE_USERS_ANY: 'manage_users_any',
  MANAGE_USERS: 'manage_users', // manage users but not master
  CHANGE_USER_STATUS_ANY: 'change_user_status_any',
  INTERNAL_ACCESS: 'internal_access',
  FINANCEIRO_ACCESS: 'financeiro_access',
  COMPRAS_ACCESS: 'compras_access',
  COMPRAS_APPROVE: 'compras_approve',
  COMERCIAL_ACCESS: 'comercial_access',
  COMERCIAL_APPROVE: 'comercial_approve'
};

// Mapping de permissões por role (master tratado separadamente)
const rolePermissions = {
  [ROLES.ADMIN]: [
    PERMISSIONS.INTERNAL_ACCESS,
    PERMISSIONS.MANAGE_USERS
  ],
  [ROLES.FINANCEIRO]: [
    PERMISSIONS.FINANCEIRO_ACCESS
  ],
  [ROLES.COMPRAS]: [
    PERMISSIONS.COMPRAS_ACCESS
    // aprovação pode ser configurada para compras_approve
  ],
  [ROLES.COMERCIAL]: [
    PERMISSIONS.COMERCIAL_ACCESS
    // aprovação pode ser configurada para comercial_approve
  ]
};

function hasPermission(role, permission) {
  if (!role) return false;
  if (role === ROLES.MASTER) return true; // master tem acesso total
  const perms = rolePermissions[role] || [];
  return perms.includes(permission);
}

module.exports = { ROLES, PERMISSIONS, hasPermission };
