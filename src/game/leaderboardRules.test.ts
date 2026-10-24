import { describe, expect, it } from 'vitest'
import type { LeaderboardFixture } from './leaderboardRules'
import { rankLeaderboardFixtures } from './leaderboardRules'

const base: LeaderboardFixture = {
  id: 'session-a',
  studentId: 'student-a',
  mode: 'single_table',
  selectedTable: 3,
  score: 10,
  totalQuestions: 10,
  correctAnswers: 8,
  averageAnswerTimeMs: 1_000,
  endedAt: '2026-10-24T10:00:00.000Z',
}

describe('règles de classement', () => {
  it('sépare strictement chaque table et le mode global', () => {
    const entries = [
      base,
      { ...base, id: 'table-4', studentId: 'student-b', selectedTable: 4, score: 99 },
      {
        ...base,
        id: 'all-tables',
        studentId: 'student-c',
        mode: 'all_tables' as const,
        selectedTable: null,
        score: 100,
      },
    ]

    expect(rankLeaderboardFixtures(entries, 'single_table', 3).map((entry) => entry.id)).toEqual([
      'session-a',
    ])
    expect(rankLeaderboardFixtures(entries, 'all_tables', null).map((entry) => entry.id)).toEqual([
      'all-tables',
    ])
  })

  it('conserve uniquement le meilleur score de chaque élève', () => {
    const entries = [base, { ...base, id: 'better', score: 12 }]
    expect(rankLeaderboardFixtures(entries, 'single_table', 3)).toHaveLength(1)
    expect(rankLeaderboardFixtures(entries, 'single_table', 3)[0].id).toBe('better')
  })

  it('applique score, réussite, bonnes réponses, temps moyen puis ancienneté', () => {
    const entries: LeaderboardFixture[] = [
      { ...base, id: 'low-score', studentId: 'z', score: 9 },
      { ...base, id: 'accuracy', studentId: 'a', correctAnswers: 9 },
      { ...base, id: 'more-correct', studentId: 'b', totalQuestions: 20, correctAnswers: 16 },
      { ...base, id: 'fast', studentId: 'c', averageAnswerTimeMs: 500 },
      {
        ...base,
        id: 'oldest',
        studentId: 'd',
        endedAt: '2026-10-23T10:00:00.000Z',
      },
    ]

    expect(rankLeaderboardFixtures(entries, 'single_table', 3).map((entry) => entry.id)).toEqual([
      'accuracy',
      'more-correct',
      'fast',
      'oldest',
      'low-score',
    ])
  })

  it('limite le classement à cinq élèves par défaut', () => {
    const entries = Array.from({ length: 8 }, (_, index) => ({
      ...base,
      id: `session-${index}`,
      studentId: `student-${index}`,
      score: index,
    }))

    expect(rankLeaderboardFixtures(entries, 'single_table', 3)).toHaveLength(5)
    expect(rankLeaderboardFixtures(entries, 'single_table', 3)[0].score).toBe(7)
  })
})
