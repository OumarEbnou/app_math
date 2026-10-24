import type {
  AdminStudent,
  CreateStudentInput,
  DashboardData,
  GameSessionSummary,
  GameSettings,
  PagedResult,
  ResultFilters,
  StudentListOptions,
  UpdateStudentInput,
} from '../models/Admin'
import { getSupabaseClient } from './supabaseClient'

type UnknownRecord = Record<string, unknown>

function toRecord(value: unknown): UnknownRecord {
  return value !== null && typeof value === 'object' ? (value as UnknownRecord) : {}
}

function toStringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function toNumberValue(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  return fallback
}

function toBooleanValue(value: unknown): boolean {
  return value === true
}

function parseStudent(value: unknown): AdminStudent {
  const row = toRecord(value)
  return {
    id: toStringValue(row.id),
    email: toStringValue(row.email),
    displayName: toStringValue(row.display_name, 'Élève'),
    isActive: toBooleanValue(row.is_active),
    createdAt: toStringValue(row.created_at),
    updatedAt: toStringValue(row.updated_at),
    totalSessions: toNumberValue(row.total_sessions),
    bestScore: toNumberValue(row.best_score),
  }
}

function readStudentName(value: unknown): string {
  const relation = Array.isArray(value) ? value[0] : value
  return toStringValue(toRecord(relation).display_name, 'Élève')
}

function parseSession(value: unknown): GameSessionSummary {
  const row = toRecord(value)
  const mode = row.mode === 'all_tables' ? 'all_tables' : 'single_table'

  return {
    id: toStringValue(row.id),
    studentId: toStringValue(row.student_id),
    studentName: toStringValue(row.student_name, readStudentName(row.student)),
    mode,
    selectedTable: row.selected_table === null ? null : toNumberValue(row.selected_table),
    score: toNumberValue(row.score),
    totalQuestions: toNumberValue(row.total_questions),
    correctAnswers: toNumberValue(row.correct_answers),
    wrongAnswers: toNumberValue(row.wrong_answers),
    bestFastStreak: toNumberValue(row.best_fast_streak),
    maxMultiplierReached: toNumberValue(row.max_multiplier_reached, 1),
    averageAnswerTimeMs:
      row.average_answer_time_ms === null
        ? null
        : toNumberValue(row.average_answer_time_ms),
    startedAt: toStringValue(row.started_at),
    endedAt: toStringValue(row.ended_at),
  }
}

function parseSettings(value: unknown): GameSettings {
  const row = toRecord(value)
  const tables = Array.isArray(row.enabled_tables)
    ? row.enabled_tables.map((table) => toNumberValue(table)).filter((table) => table > 0)
    : []

  return {
    gameDurationSeconds: toNumberValue(row.game_duration_seconds, 60),
    fastAnswerLimitMs: toNumberValue(row.fast_answer_limit_ms, 3000),
    fastAnswersForMultiplier: toNumberValue(row.fast_answers_for_multiplier, 4),
    maxMultiplier: toNumberValue(row.max_multiplier, 10),
    minFactor: toNumberValue(row.min_factor, 1),
    maxFactor: toNumberValue(row.max_factor, 10),
    enabledTables: tables,
    feedbackDurationMs: toNumberValue(row.feedback_duration_ms, 500),
    leaderboardSize: toNumberValue(row.leaderboard_size, 5),
    updatedAt: toStringValue(row.updated_at),
  }
}

function throwQueryError(error: { message: string } | null, fallback: string): void {
  if (error) {
    throw new Error(fallback)
  }
}

async function readFunctionError(error: unknown, fallback: string): Promise<string> {
  const context = toRecord(error).context

  if (context instanceof Response) {
    try {
      const body = toRecord(await context.clone().json())
      const message = toStringValue(body.error)
      if (message) {
        return message
      }
    } catch {
      return fallback
    }
  }

  return fallback
}

async function invokeAdminFunction(
  functionName: 'create-student' | 'manage-student',
  body: UnknownRecord,
): Promise<void> {
  const client = getSupabaseClient()
  const { data, error } = await client.functions.invoke(functionName, { body })

  if (error) {
    throw new Error(await readFunctionError(error, 'L’opération administrateur a échoué.'))
  }

  const responseBody = toRecord(data)
  if (typeof responseBody.error === 'string') {
    throw new Error(responseBody.error)
  }
}

const sessionSelection = `
  id,
  student_id,
  mode,
  selected_table,
  score,
  total_questions,
  correct_answers,
  wrong_answers,
  best_fast_streak,
  max_multiplier_reached,
  average_answer_time_ms,
  started_at,
  ended_at,
  student:profiles!game_sessions_student_id_fkey(display_name)
`

export async function getAdminDashboard(): Promise<DashboardData> {
  const client = getSupabaseClient()
  const [studentsResult, sessionCountResult, recentResult, singleResult, allResult] =
    await Promise.all([
      client
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'student')
        .eq('is_active', true),
      client.from('game_sessions').select('id', { count: 'exact', head: true }),
      client.from('game_sessions').select(sessionSelection).order('ended_at', { ascending: false }).limit(5),
      client.rpc('admin_get_top_scores', { requested_mode: 'single_table', result_limit: 3 }),
      client.rpc('admin_get_top_scores', { requested_mode: 'all_tables', result_limit: 3 }),
    ])

  throwQueryError(studentsResult.error, 'Impossible de charger le nombre d’élèves.')
  throwQueryError(sessionCountResult.error, 'Impossible de charger le nombre de parties.')
  throwQueryError(recentResult.error, 'Impossible de charger les parties récentes.')
  throwQueryError(singleResult.error, 'Impossible de charger les meilleurs scores.')
  throwQueryError(allResult.error, 'Impossible de charger les meilleurs scores.')

  return {
    activeStudents: studentsResult.count ?? 0,
    totalSessions: sessionCountResult.count ?? 0,
    recentSessions: (recentResult.data ?? []).map(parseSession),
    singleTableTop: (singleResult.data ?? []).map(parseSession),
    allTablesTop: (allResult.data ?? []).map(parseSession),
  }
}

export async function listStudents(options: StudentListOptions): Promise<PagedResult<AdminStudent>> {
  const client = getSupabaseClient()
  const { data, error } = await client.rpc('admin_list_students', {
    search_term: options.search.trim(),
    order_field: options.sortBy,
    order_direction: options.sortDirection,
    page_size: options.pageSize,
    page_offset: options.page * options.pageSize,
  })

  throwQueryError(error, 'Impossible de charger les élèves.')
  const rows = Array.isArray(data) ? data : []
  const students = rows.map(parseStudent)

  return {
    items: students,
    total: rows.length > 0 ? toNumberValue(toRecord(rows[0]).total_count) : 0,
  }
}

export async function getStudent(studentId: string): Promise<AdminStudent> {
  const client = getSupabaseClient()
  const { data, error } = await client.rpc('admin_get_student', {
    requested_student_id: studentId,
  })

  throwQueryError(error, 'Impossible de charger cet élève.')
  const row = Array.isArray(data) ? data[0] : data
  if (!row) {
    throw new Error('Cet élève est introuvable.')
  }

  return parseStudent(row)
}

export async function createStudent(input: CreateStudentInput): Promise<void> {
  await invokeAdminFunction('create-student', {
    email: input.email.trim().toLowerCase(),
    password: input.password,
    displayName: input.displayName.trim(),
  })
}

export async function updateStudent(input: UpdateStudentInput): Promise<void> {
  await invokeAdminFunction('manage-student', {
    action: 'update-identity',
    studentId: input.studentId,
    email: input.email.trim().toLowerCase(),
    displayName: input.displayName.trim(),
  })
}

export async function setStudentActive(studentId: string, isActive: boolean): Promise<void> {
  await invokeAdminFunction('manage-student', {
    action: 'set-active',
    studentId,
    isActive,
  })
}

export async function resetStudentPassword(studentId: string, password: string): Promise<void> {
  await invokeAdminFunction('manage-student', {
    action: 'reset-password',
    studentId,
    password,
  })
}

export async function getGameSettings(): Promise<GameSettings> {
  const client = getSupabaseClient()
  const { data, error } = await client.from('game_settings').select('*').eq('id', 1).single()

  throwQueryError(error, 'Impossible de charger les paramètres du jeu.')
  return parseSettings(data)
}

export async function updateGameSettings(settings: GameSettings): Promise<GameSettings> {
  const client = getSupabaseClient()
  const { error } = await client.rpc('admin_update_game_settings', {
    requested_game_duration_seconds: settings.gameDurationSeconds,
    requested_fast_answer_limit_ms: settings.fastAnswerLimitMs,
    requested_fast_answers_for_multiplier: settings.fastAnswersForMultiplier,
    requested_max_multiplier: settings.maxMultiplier,
    requested_min_factor: settings.minFactor,
    requested_max_factor: settings.maxFactor,
    requested_enabled_tables: settings.enabledTables,
    requested_feedback_duration_ms: settings.feedbackDurationMs,
    requested_leaderboard_size: settings.leaderboardSize,
  })

  throwQueryError(error, 'Les paramètres n’ont pas pu être enregistrés.')
  return getGameSettings()
}

export async function listResults(filters: ResultFilters): Promise<PagedResult<GameSessionSummary>> {
  const client = getSupabaseClient()
  let query = client
    .from('game_sessions')
    .select(sessionSelection, { count: 'exact' })
    .order('ended_at', { ascending: false })

  if (filters.studentId) {
    query = query.eq('student_id', filters.studentId)
  }
  if (filters.mode) {
    query = query.eq('mode', filters.mode)
  }
  if (filters.mode === 'single_table' && filters.selectedTable !== null) {
    query = query.eq('selected_table', filters.selectedTable)
  }
  if (filters.dateFrom) {
    query = query.gte('ended_at', `${filters.dateFrom}T00:00:00.000Z`)
  }
  if (filters.dateTo) {
    query = query.lte('ended_at', `${filters.dateTo}T23:59:59.999Z`)
  }

  const from = filters.page * filters.pageSize
  const { data, error, count } = await query.range(from, from + filters.pageSize - 1)

  throwQueryError(error, 'Impossible de charger les résultats.')
  return {
    items: (data ?? []).map(parseSession),
    total: count ?? 0,
  }
}

export async function getStudentHistory(
  studentId: string,
  page: number,
  pageSize: number,
): Promise<PagedResult<GameSessionSummary>> {
  const client = getSupabaseClient()
  const from = page * pageSize
  const { data, error, count } = await client
    .from('game_sessions')
    .select(sessionSelection, { count: 'exact' })
    .eq('student_id', studentId)
    .order('ended_at', { ascending: false })
    .range(from, from + pageSize - 1)

  throwQueryError(error, 'Impossible de charger l’historique de cet élève.')
  return {
    items: (data ?? []).map(parseSession),
    total: count ?? 0,
  }
}

export async function deleteGameSession(sessionId: string, reason: string): Promise<void> {
  const client = getSupabaseClient()
  const { error } = await client.rpc('admin_delete_game_session', {
    requested_session_id: sessionId,
    deletion_reason: reason.trim(),
  })

  throwQueryError(error, 'Le score n’a pas pu être supprimé.')
}
