import type {
  GameAnswer,
  GameAttempt,
  GameHistoryItem,
  GameHistoryPage,
  GameSettingsSnapshot,
  LeaderboardEntry,
  PlayableGameMode,
  SavedGameResult,
} from '../models/Game'
import { getSupabaseClient } from './supabaseClient'

type UnknownRecord = Record<string, unknown>

function toRecord(value: unknown): UnknownRecord {
  return value !== null && typeof value === 'object' ? (value as UnknownRecord) : {}
}

function toStringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function toNumberValue(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }
  return fallback
}

function toNullableNumber(value: unknown): number | null {
  return value === null || value === undefined ? null : toNumberValue(value)
}

function firstRow(value: unknown): unknown {
  return Array.isArray(value) ? value[0] : value
}

function throwSupabaseError(error: { message: string } | null, fallback: string): void {
  if (error) throw new Error(fallback)
}

export function parseGameSettingsSnapshot(value: unknown): GameSettingsSnapshot {
  const row = toRecord(value)
  const enabledTables = Array.isArray(row.enabled_tables)
    ? row.enabled_tables
        .map((table) => toNumberValue(table, -1))
        .filter((table) => Number.isInteger(table) && table >= 1 && table <= 20)
    : []

  return {
    gameDurationSeconds: toNumberValue(row.game_duration_seconds, 60),
    fastAnswerLimitMs: toNumberValue(row.fast_answer_limit_ms, 3_000),
    fastAnswersForMultiplier: toNumberValue(row.fast_answers_for_multiplier, 4),
    maxMultiplier: toNumberValue(row.max_multiplier, 10),
    minFactor: toNumberValue(row.min_factor, 1),
    maxFactor: toNumberValue(row.max_factor, 10),
    enabledTables,
    feedbackDurationMs: toNumberValue(row.feedback_duration_ms, 500),
    leaderboardSize: toNumberValue(row.leaderboard_size, 5),
    settingsUpdatedAt: toStringValue(row.settings_updated_at, toStringValue(row.updated_at)),
  }
}

function parseHistoryItem(value: unknown): GameHistoryItem {
  const row = toRecord(value)
  return {
    id: toStringValue(row.id),
    mode: row.mode === 'all_tables' ? 'all_tables' : 'single_table',
    selectedTable: toNullableNumber(row.selected_table),
    score: toNumberValue(row.score),
    totalQuestions: toNumberValue(row.total_questions),
    correctAnswers: toNumberValue(row.correct_answers),
    wrongAnswers: toNumberValue(row.wrong_answers),
    bestFastStreak: toNumberValue(row.best_fast_streak),
    maxMultiplierReached: toNumberValue(row.max_multiplier_reached, 1),
    averageAnswerTimeMs: toNullableNumber(row.average_answer_time_ms),
    startedAt: toStringValue(row.started_at),
    endedAt: toStringValue(row.ended_at),
  }
}

export async function getActiveGameSettings(): Promise<GameSettingsSnapshot> {
  const client = getSupabaseClient()
  const { data, error } = await client.from('game_settings').select('*').eq('id', 1).single()
  throwSupabaseError(error, 'Impossible de charger les paramètres du jeu.')
  return parseGameSettingsSnapshot(data)
}

export async function createGameAttempt(
  mode: PlayableGameMode,
  selectedTable: number | null,
): Promise<GameAttempt> {
  const client = getSupabaseClient()
  const { data, error } = await client.rpc('start_game', {
    requested_mode: mode,
    requested_table: selectedTable,
  })
  throwSupabaseError(error, 'La partie n’a pas pu démarrer. Réessaie dans un instant.')

  const row = toRecord(firstRow(data))
  const startedAtMs = Date.parse(toStringValue(row.server_started_at))
  const endsAtMs = Date.parse(toStringValue(row.server_ends_at))
  const id = toStringValue(row.attempt_id)
  if (!id || !Number.isFinite(startedAtMs) || !Number.isFinite(endsAtMs)) {
    throw new Error('Supabase a renvoyé une tentative de jeu incomplète.')
  }

  return {
    id,
    mode,
    selectedTable,
    startedAtMs,
    endsAtMs,
    settings: parseGameSettingsSnapshot(row.settings_snapshot),
  }
}

export async function saveGame(
  attemptId: string,
  answers: GameAnswer[],
): Promise<SavedGameResult> {
  const client = getSupabaseClient()
  const answerPayload = answers.map((answer) => ({
    position: answer.position,
    left_factor: answer.leftFactor,
    right_factor: answer.rightFactor,
    submitted_answer: answer.submittedAnswer,
    response_time_ms: answer.responseTimeMs,
    shown_at: new Date(answer.shownAtMs).toISOString(),
    answered_at: new Date(answer.answeredAtMs).toISOString(),
  }))
  const { data, error } = await client.rpc('submit_game', {
    requested_attempt_id: attemptId,
    requested_answers: answerPayload,
  })
  throwSupabaseError(
    error,
    'Le score n’a pas pu être enregistré. Ta partie reste affichée pour pouvoir réessayer.',
  )

  const row = toRecord(firstRow(data))
  const sessionId = toStringValue(row.session_id)
  if (!sessionId) throw new Error('La confirmation d’enregistrement reçue est incomplète.')

  return {
    sessionId,
    officialScore: toNumberValue(row.official_score),
    totalQuestions: toNumberValue(row.total_questions),
    correctAnswers: toNumberValue(row.correct_answers),
    wrongAnswers: toNumberValue(row.wrong_answers),
    bestFastStreak: toNumberValue(row.best_fast_streak),
    maxMultiplierReached: toNumberValue(row.max_multiplier_reached, 1),
    averageAnswerTimeMs: toNullableNumber(row.average_answer_time_ms),
    startedAt: toStringValue(row.started_at),
    endedAt: toStringValue(row.ended_at),
    created: row.created === true,
    rankingPosition: toNullableNumber(row.ranking_position),
    rankingSize: toNullableNumber(row.ranking_size),
    isPersonalBest: typeof row.is_personal_best === 'boolean' ? row.is_personal_best : null,
  }
}

export async function getGameHistory(options: {
  mode: PlayableGameMode | ''
  selectedTable: number | null
  page: number
  pageSize: number
}): Promise<GameHistoryPage> {
  const client = getSupabaseClient()
  let historyQuery = client
    .from('game_sessions')
    .select(
      'id, mode, selected_table, score, total_questions, correct_answers, wrong_answers, best_fast_streak, max_multiplier_reached, average_answer_time_ms, started_at, ended_at',
      { count: 'exact' },
    )
    .order('ended_at', { ascending: false })
  let bestQuery = client.from('game_sessions').select('score').order('score', { ascending: false }).limit(1)

  if (options.mode) {
    historyQuery = historyQuery.eq('mode', options.mode)
    bestQuery = bestQuery.eq('mode', options.mode)
  }
  if (options.mode === 'single_table' && options.selectedTable !== null) {
    historyQuery = historyQuery.eq('selected_table', options.selectedTable)
    bestQuery = bestQuery.eq('selected_table', options.selectedTable)
  }

  const firstIndex = options.page * options.pageSize
  const [historyResult, bestResult] = await Promise.all([
    historyQuery.range(firstIndex, firstIndex + options.pageSize - 1),
    bestQuery,
  ])
  throwSupabaseError(historyResult.error, 'Impossible de charger ton historique.')
  throwSupabaseError(bestResult.error, 'Impossible de déterminer ton meilleur score.')

  const bestRow = toRecord(bestResult.data?.[0])
  return {
    items: (historyResult.data ?? []).map(parseHistoryItem),
    total: historyResult.count ?? 0,
    bestScore: bestResult.data?.[0] ? toNumberValue(bestRow.score) : null,
  }
}

export async function getPersonalBestScores(limit = 5): Promise<GameHistoryItem[]> {
  const client = getSupabaseClient()
  const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 20)
  const { data, error } = await client
    .from('game_sessions')
    .select(
      'id, mode, selected_table, score, total_questions, correct_answers, wrong_answers, best_fast_streak, max_multiplier_reached, average_answer_time_ms, started_at, ended_at',
    )
    .order('score', { ascending: false })
    .order('ended_at', { ascending: false })
    .limit(safeLimit)

  throwSupabaseError(error, 'Impossible de charger tes meilleurs scores.')
  return (data ?? []).map(parseHistoryItem)
}

export async function getLeaderboard(
  mode: PlayableGameMode,
  selectedTable: number | null,
): Promise<LeaderboardEntry[]> {
  const client = getSupabaseClient()
  const { data, error } = await client.rpc('get_public_leaderboard', {
    requested_mode: mode,
    requested_table: selectedTable,
  })
  throwSupabaseError(error, 'Impossible de charger ce classement.')

  return (Array.isArray(data) ? data : []).map((value) => {
    const row = toRecord(value)
    return {
      position: toNumberValue(row.position),
      displayName: toStringValue(row.display_name, 'Élève'),
      score: toNumberValue(row.score),
      endedAt: toStringValue(row.ended_at),
    }
  })
}
