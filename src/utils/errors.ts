export function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return 'Une erreur inattendue est survenue. Veuillez réessayer.'
}
