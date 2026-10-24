import { describe, expect, it } from 'vitest'
import type { GameSettings } from '../models/Admin'
import {
  hasValidationErrors,
  validateCreateStudent,
  validateGameSettings,
  validatePassword,
} from './adminValidation'

const validSettings: GameSettings = {
  gameDurationSeconds: 60,
  fastAnswerLimitMs: 3000,
  fastAnswersForMultiplier: 4,
  maxMultiplier: 10,
  minFactor: 1,
  maxFactor: 10,
  enabledTables: [2, 3, 4, 5],
  feedbackDurationMs: 500,
  leaderboardSize: 5,
  updatedAt: '2026-10-23T00:00:00.000Z',
}

describe('validation de l’administration', () => {
  it('accepte des paramètres cohérents', () => {
    expect(validateGameSettings(validSettings)).toEqual({})
  })

  it('refuse une durée et un ordre de facteurs invalides', () => {
    const errors = validateGameSettings({
      ...validSettings,
      gameDurationSeconds: 0,
      minFactor: 12,
      maxFactor: 4,
    })

    expect(errors.gameDurationSeconds).toBeDefined()
    expect(errors.maxFactor).toBeDefined()
  })

  it('exige au moins une table unique et valide', () => {
    expect(validateGameSettings({ ...validSettings, enabledTables: [] }).enabledTables).toBeDefined()
    expect(validateGameSettings({ ...validSettings, enabledTables: [3, 3] }).enabledTables).toBeDefined()
    expect(validateGameSettings({ ...validSettings, enabledTables: [21] }).enabledTables).toBeDefined()
  })

  it('refuse les valeurs qui dépassent les limites serveur', () => {
    const errors = validateGameSettings({
      ...validSettings,
      fastAnswerLimitMs: 60_001,
      fastAnswersForMultiplier: 0,
      maxMultiplier: 101,
      feedbackDurationMs: -1,
      leaderboardSize: 21,
    })

    expect(errors.fastAnswerLimitMs).toBeDefined()
    expect(errors.fastAnswersForMultiplier).toBeDefined()
    expect(errors.maxMultiplier).toBeDefined()
    expect(errors.feedbackDurationMs).toBeDefined()
    expect(errors.leaderboardSize).toBeDefined()
  })

  it('valide le compte élève et le mot de passe', () => {
    const errors = validateCreateStudent({
      email: 'adresse-invalide',
      displayName: '',
      password: 'court',
    })

    expect(hasValidationErrors(errors)).toBe(true)
    expect(errors.email).toBeDefined()
    expect(errors.displayName).toBeDefined()
    expect(validatePassword('motdepasse-solide')).toBeNull()
  })
})
