import { describe, expect, it } from 'vitest'
import { validateSupabaseConfiguration } from './environment'

describe('validateSupabaseConfiguration', () => {
  it('refuse une configuration absente', () => {
    expect(validateSupabaseConfiguration(undefined, undefined).isConfigured).toBe(false)
  })

  it('refuse les valeurs de démonstration', () => {
    const result = validateSupabaseConfiguration(
      'https://votre-projet.supabase.co',
      'votre-cle-publique-anon',
    )

    expect(result.isConfigured).toBe(false)
  })

  it('accepte une URL HTTPS et une clé renseignée', () => {
    const result = validateSupabaseConfiguration(
      'https://exemple.supabase.co',
      'une-cle-publique-valide',
    )

    expect(result).toMatchObject({ isConfigured: true, issue: null })
  })
})
