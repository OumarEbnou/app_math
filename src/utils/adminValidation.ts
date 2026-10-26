import type { CreateStudentInput, GameSettings, UpdateStudentInput } from '../models/Admin'
import { isValidUsername } from './username'

export type ValidationErrors<T extends string> = Partial<Record<T, string>>

export function validateStudentIdentity(
  input: Pick<UpdateStudentInput, 'username' | 'displayName'>,
): ValidationErrors<'username' | 'displayName'> {
  const errors: ValidationErrors<'username' | 'displayName'> = {}
  const username = input.username.trim()
  const displayName = input.displayName.trim()

  if (!isValidUsername(username)) {
    errors.username = 'Utilisez 3 à 32 caractères : lettres minuscules, chiffres, _ ou -.'
  }

  if (displayName.length < 1 || displayName.length > 80) {
    errors.displayName = 'Le pseudonyme doit contenir entre 1 et 80 caractères.'
  }

  return errors
}

export function validatePassword(password: string): string | null {
  if (password.length < 8 || password.length > 128) {
    return 'Le mot de passe doit contenir entre 8 et 128 caractères.'
  }

  return null
}

export function validateCreateStudent(
  input: CreateStudentInput,
): ValidationErrors<'username' | 'displayName' | 'password'> {
  return {
    ...validateStudentIdentity(input),
    ...(validatePassword(input.password) ? { password: validatePassword(input.password)! } : {}),
  }
}

export type SettingsField =
  | 'gameDurationSeconds'
  | 'fastAnswerLimitMs'
  | 'fastAnswersForMultiplier'
  | 'maxMultiplier'
  | 'minFactor'
  | 'maxFactor'
  | 'enabledTables'
  | 'feedbackDurationMs'
  | 'leaderboardSize'

export function validateGameSettings(settings: GameSettings): ValidationErrors<SettingsField> {
  const errors: ValidationErrors<SettingsField> = {}

  if (!Number.isInteger(settings.gameDurationSeconds) || settings.gameDurationSeconds < 10 || settings.gameDurationSeconds > 900) {
    errors.gameDurationSeconds = 'La durée doit être comprise entre 10 et 900 secondes.'
  }

  if (!Number.isInteger(settings.fastAnswerLimitMs) || settings.fastAnswerLimitMs < 250 || settings.fastAnswerLimitMs > 60_000) {
    errors.fastAnswerLimitMs = 'Le délai rapide doit être compris entre 250 et 60 000 ms.'
  }

  if (!Number.isInteger(settings.fastAnswersForMultiplier) || settings.fastAnswersForMultiplier < 1 || settings.fastAnswersForMultiplier > 100) {
    errors.fastAnswersForMultiplier = 'Le seuil doit être compris entre 1 et 100 réponses.'
  }

  if (!Number.isInteger(settings.maxMultiplier) || settings.maxMultiplier < 1 || settings.maxMultiplier > 100) {
    errors.maxMultiplier = 'Le multiplicateur doit être compris entre 1 et 100.'
  }

  if (!Number.isInteger(settings.minFactor) || settings.minFactor < 0 || settings.minFactor > 20) {
    errors.minFactor = 'Le facteur minimum doit être compris entre 0 et 20.'
  }

  if (!Number.isInteger(settings.maxFactor) || settings.maxFactor < 0 || settings.maxFactor > 20) {
    errors.maxFactor = 'Le facteur maximum doit être compris entre 0 et 20.'
  } else if (settings.maxFactor < settings.minFactor) {
    errors.maxFactor = 'Le facteur maximum doit être supérieur ou égal au minimum.'
  }

  const uniqueTables = new Set(settings.enabledTables)
  if (
    settings.enabledTables.length < 1 ||
    uniqueTables.size !== settings.enabledTables.length ||
    settings.enabledTables.some((table) => !Number.isInteger(table) || table < 1 || table > 20)
  ) {
    errors.enabledTables = 'Choisissez au moins une table unique comprise entre 1 et 20.'
  }

  if (!Number.isInteger(settings.feedbackDurationMs) || settings.feedbackDurationMs < 0 || settings.feedbackDurationMs > 10_000) {
    errors.feedbackDurationMs = 'La durée du retour doit être comprise entre 0 et 10 000 ms.'
  }

  if (!Number.isInteger(settings.leaderboardSize) || settings.leaderboardSize < 1 || settings.leaderboardSize > 20) {
    errors.leaderboardSize = 'Le classement doit contenir entre 1 et 20 places.'
  }

  return errors
}

export function hasValidationErrors(errors: object): boolean {
  return Object.keys(errors).length > 0
}
