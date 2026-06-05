export const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN']
export const INSCRIPTION_SOLDE_ROLES = [...ADMIN_ROLES, 'COMPTABLE']
export const PAYMENT_ROLES = INSCRIPTION_SOLDE_ROLES
export const EXPENSE_ROLES = PAYMENT_ROLES
export const TREASURY_ROLES = PAYMENT_ROLES

export const normalizeRole = (role = '') => role.trim().toUpperCase()
