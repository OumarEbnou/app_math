import type { PlayableGameMode } from '../models/Game'

export interface LeaderboardFixture {
  id: string
  studentId: string
  mode: PlayableGameMode
  selectedTable: number | null
  score: number
  totalQuestions: number
  correctAnswers: number
  averageAnswerTimeMs: number | null
  endedAt: string
}

function accuracy(entry: LeaderboardFixture): number {
  return entry.totalQuestions === 0 ? 0 : entry.correctAnswers / entry.totalQuestions
}

export function compareLeaderboardScores(
  left: LeaderboardFixture,
  right: LeaderboardFixture,
): number {
  return (
    right.score - left.score ||
    accuracy(right) - accuracy(left) ||
    right.correctAnswers - left.correctAnswers ||
    (left.averageAnswerTimeMs ?? Number.POSITIVE_INFINITY) -
      (right.averageAnswerTimeMs ?? Number.POSITIVE_INFINITY) ||
    Date.parse(left.endedAt) - Date.parse(right.endedAt) ||
    left.studentId.localeCompare(right.studentId) ||
    left.id.localeCompare(right.id)
  )
}

export function rankLeaderboardFixtures(
  entries: LeaderboardFixture[],
  mode: PlayableGameMode,
  selectedTable: number | null,
  limit = 5,
): LeaderboardFixture[] {
  const eligible = entries.filter(
    (entry) =>
      entry.mode === mode &&
      (mode === 'all_tables'
        ? entry.selectedTable === null && selectedTable === null
        : entry.selectedTable === selectedTable && selectedTable !== null),
  )
  const bestByStudent = new Map<string, LeaderboardFixture>()

  for (const entry of [...eligible].sort(compareLeaderboardScores)) {
    if (!bestByStudent.has(entry.studentId)) bestByStudent.set(entry.studentId, entry)
  }

  return [...bestByStudent.values()].sort(compareLeaderboardScores).slice(0, limit)
}
