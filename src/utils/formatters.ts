import type { GameMode } from '../models/Admin'

export function formatDateTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

export function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'short',
  }).format(date)
}

export function formatGameMode(mode: GameMode, selectedTable: number | null): string {
  if (mode === 'all_tables') {
    return 'Toutes les tables'
  }

  return selectedTable === null ? 'Une table' : `Table de ${selectedTable}`
}

export function calculateAccuracy(correctAnswers: number, totalQuestions: number): number {
  if (totalQuestions <= 0) {
    return 0
  }

  return Math.round((correctAnswers / totalQuestions) * 100)
}
