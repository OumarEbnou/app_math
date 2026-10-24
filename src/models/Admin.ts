export type GameMode = 'single_table' | 'all_tables'

export interface AdminStudent {
  id: string
  email: string
  displayName: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  totalSessions: number
  bestScore: number
}

export interface GameSettings {
  gameDurationSeconds: number
  fastAnswerLimitMs: number
  fastAnswersForMultiplier: number
  maxMultiplier: number
  minFactor: number
  maxFactor: number
  enabledTables: number[]
  feedbackDurationMs: number
  leaderboardSize: number
  updatedAt: string
}

export interface GameSessionSummary {
  id: string
  studentId: string
  studentName: string
  mode: GameMode
  selectedTable: number | null
  score: number
  totalQuestions: number
  correctAnswers: number
  wrongAnswers: number
  bestFastStreak: number
  maxMultiplierReached: number
  averageAnswerTimeMs: number | null
  startedAt: string
  endedAt: string
}

export interface PagedResult<T> {
  items: T[]
  total: number
}

export interface DashboardData {
  activeStudents: number
  totalSessions: number
  recentSessions: GameSessionSummary[]
  singleTableTop: GameSessionSummary[]
  allTablesTop: GameSessionSummary[]
}

export interface StudentListOptions {
  search: string
  sortBy: 'display_name' | 'email' | 'created_at' | 'total_sessions' | 'best_score'
  sortDirection: 'asc' | 'desc'
  page: number
  pageSize: number
}

export interface ResultFilters {
  studentId: string
  mode: GameMode | ''
  selectedTable: number | null
  dateFrom: string
  dateTo: string
  page: number
  pageSize: number
}

export interface CreateStudentInput {
  email: string
  password: string
  displayName: string
}

export interface UpdateStudentInput {
  studentId: string
  email: string
  displayName: string
}
