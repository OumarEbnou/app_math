export type PlayableGameMode = 'single_table' | 'all_tables'

export interface GameSettingsSnapshot {
  gameDurationSeconds: number
  fastAnswerLimitMs: number
  fastAnswersForMultiplier: number
  maxMultiplier: number
  minFactor: number
  maxFactor: number
  enabledTables: number[]
  feedbackDurationMs: number
  leaderboardSize: number
  settingsUpdatedAt: string
}

export interface GameAttempt {
  id: string
  mode: PlayableGameMode
  selectedTable: number | null
  startedAtMs: number
  endsAtMs: number
  settings: GameSettingsSnapshot
}

export type SingleTableAttempt = GameAttempt & {
  mode: 'single_table'
  selectedTable: number
}

export type AllTablesAttempt = GameAttempt & {
  mode: 'all_tables'
  selectedTable: null
}

export interface GameQuestion {
  position: number
  leftFactor: number
  rightFactor: number
  expectedAnswer: number
  shownAtMs: number
}

export type AnswerFeedback = 'correct_fast' | 'correct_slow' | 'wrong'

export interface GameAnswer {
  position: number
  leftFactor: number
  rightFactor: number
  submittedAnswer: number
  isCorrect: boolean
  responseTimeMs: number
  wasFast: boolean
  multiplierApplied: number
  pointsAwarded: number
  shownAtMs: number
  answeredAtMs: number
}

export interface GameFeedback {
  kind: AnswerFeedback
  pointsAwarded: number
  expectedAnswer: number
  submittedAnswer: number
  multiplierApplied: number
}

export type GameStatus = 'playing' | 'feedback' | 'finished'

export interface GameState {
  attemptId: string
  mode: PlayableGameMode
  selectedTable: number | null
  settings: GameSettingsSnapshot
  startedAtMs: number
  endsAtMs: number
  finishedAtMs: number | null
  status: GameStatus
  question: GameQuestion | null
  feedback: GameFeedback | null
  answers: GameAnswer[]
  score: number
  fastStreak: number
  bestFastStreak: number
  multiplier: number
  maxMultiplierReached: number
  remainingTables: number[]
}

export type SingleTableGameState = GameState & {
  mode: 'single_table'
  selectedTable: number
}

export interface SubmitAnswerResult {
  accepted: boolean
  expired: boolean
  state: GameState
}

export interface SavedGameResult {
  sessionId: string
  officialScore: number
  totalQuestions: number
  correctAnswers: number
  wrongAnswers: number
  bestFastStreak: number
  maxMultiplierReached: number
  averageAnswerTimeMs: number | null
  startedAt: string
  endedAt: string
  created: boolean
  rankingPosition: number | null
  rankingSize: number | null
  isPersonalBest: boolean | null
}

export interface GameHistoryItem {
  id: string
  mode: PlayableGameMode
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

export interface GameHistoryPage {
  items: GameHistoryItem[]
  total: number
  bestScore: number | null
}

export interface LeaderboardEntry {
  position: number
  displayName: string
  score: number
  endedAt: string
}
