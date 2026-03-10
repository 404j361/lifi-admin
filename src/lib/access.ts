export const USER_ROLE = 'user';
export const ADMIN_ROLE = 'admin';
export const SALE_ROLE = 'sale';
export const ASSIGNABLE_ROLES = [USER_ROLE, SALE_ROLE, ADMIN_ROLE] as const;

export type AssignableRole = (typeof ASSIGNABLE_ROLES)[number];

export function isAssignableRole(role: string | null | undefined): role is AssignableRole {
	return role === USER_ROLE || role === SALE_ROLE || role === ADMIN_ROLE;
}

export function isAdminRole(role: string | null | undefined): role is typeof ADMIN_ROLE {
	return role === ADMIN_ROLE;
}

export function canAccessBackoffice(
	role: string | null | undefined
): role is typeof ADMIN_ROLE | typeof SALE_ROLE {
	return role === ADMIN_ROLE || role === SALE_ROLE;
}
