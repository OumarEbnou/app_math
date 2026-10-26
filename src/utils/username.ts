export const usernamePattern = /^[a-z0-9][a-z0-9_-]{2,31}$/

const loginEmailDomain = 'accounts.invalid'

export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase()
}

export function isValidUsername(value: string): boolean {
  return usernamePattern.test(normalizeUsername(value))
}

export function usernameToLoginEmail(value: string): string {
  const username = normalizeUsername(value)

  if (!usernamePattern.test(username)) {
    throw new Error('Nom d\u2019utilisateur invalide.')
  }

  return `${username}@${loginEmailDomain}`
}

export function resolveLoginEmail(identifier: string): string {
  const normalizedIdentifier = identifier.trim().toLowerCase()

  // Les comptes administrateurs créés avant la connexion par nom d’utilisateur
  // peuvent continuer à se connecter avec leur adresse e-mail.
  if (normalizedIdentifier.includes('@')) {
    return normalizedIdentifier
  }

  return usernameToLoginEmail(normalizedIdentifier)
}
