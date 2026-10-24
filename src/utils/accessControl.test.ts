import { describe, expect, it } from 'vitest'
import { getHomePath, isRoleAllowed } from './accessControl'

describe('contrôle des rôles', () => {
  it('dirige chaque rôle vers son espace', () => {
    expect(getHomePath('admin')).toBe('/admin')
    expect(getHomePath('student')).toBe('/eleve')
  })

  it('refuse un élève sur une route administrateur', () => {
    expect(isRoleAllowed('student', ['admin'])).toBe(false)
    expect(isRoleAllowed('admin', ['admin'])).toBe(true)
  })
})
