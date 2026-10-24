import type { AppRole } from '../types/auth'

export function getHomePath(role: AppRole): string {
  return role === 'admin' ? '/admin' : '/eleve'
}

export function isRoleAllowed(role: AppRole, allowedRoles: readonly AppRole[]): boolean {
  return allowedRoles.includes(role)
}
