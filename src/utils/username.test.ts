import { describe, expect, it } from 'vitest'
import {
  isValidUsername,
  normalizeUsername,
  resolveLoginEmail,
  usernameToLoginEmail,
} from './username'

describe('identifiants de connexion', () => {
  it('normalise un nom d’utilisateur et produit l’identifiant Auth technique', () => {
    expect(normalizeUsername('  Esma_3 ')).toBe('esma_3')
    expect(usernameToLoginEmail('  Esma_3 ')).toBe('esma_3@accounts.invalid')
  })

  it('refuse les noms trop courts ou contenant des caractères non autorisés', () => {
    expect(isValidUsername('ab')).toBe(false)
    expect(isValidUsername('élève 3')).toBe(false)
    expect(() => usernameToLoginEmail('élève 3')).toThrow('Nom d’utilisateur invalide.')
  })

  it('conserve la connexion e-mail des anciens comptes administrateurs', () => {
    expect(resolveLoginEmail(' Admin@Example.com ')).toBe('admin@example.com')
  })
})
