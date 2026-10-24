import type {
  GameAttempt,
  GameQuestion,
  GameSettingsSnapshot,
  GameState,
  PlayableGameMode,
  SubmitAnswerResult,
} from '../models/Game'

export type RandomSource = () => number

interface GeneratedQuestion {
  question: GameQuestion
  remainingTables: number[]
}

function assertValidSettings(settings: GameSettingsSnapshot): void {
  if (
    settings.gameDurationSeconds <= 0 ||
    settings.fastAnswerLimitMs <= 0 ||
    settings.fastAnswersForMultiplier <= 0 ||
    settings.maxMultiplier <= 0 ||
    settings.minFactor > settings.maxFactor ||
    settings.enabledTables.length === 0
  ) {
    throw new Error('Les paramètres de cette partie sont invalides.')
  }
}

function randomInteger(random: RandomSource, minimum: number, maximum: number): number {
  const normalizedRandom = Math.min(Math.max(random(), 0), 0.999999999999)
  return minimum + Math.floor(normalizedRandom * (maximum - minimum + 1))
}

function shuffle(values: number[], random: RandomSource): number[] {
  const result = [...values]
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = randomInteger(random, 0, index)
    ;[result[index], result[target]] = [result[target], result[index]]
  }
  return result
}

function takeTable(
  mode: PlayableGameMode,
  selectedTable: number | null,
  settings: GameSettingsSnapshot,
  remainingTables: number[],
  previousQuestion: GameQuestion | null,
  random: RandomSource,
): { leftFactor: number; remainingTables: number[] } {
  if (mode === 'single_table') {
    if (selectedTable === null) {
      throw new Error('La table choisie est manquante.')
    }
    return { leftFactor: selectedTable, remainingTables: [] }
  }

  const queue =
    remainingTables.length > 0 ? [...remainingTables] : shuffle(settings.enabledTables, random)
  if (queue.length > 1 && queue[0] === previousQuestion?.leftFactor) {
    const differentIndex = queue.findIndex((table) => table !== previousQuestion.leftFactor)
    ;[queue[0], queue[differentIndex]] = [queue[differentIndex], queue[0]]
  }

  const [leftFactor, ...nextQueue] = queue
  return { leftFactor, remainingTables: nextQueue }
}

export function generateGameQuestion(
  settings: GameSettingsSnapshot,
  mode: PlayableGameMode,
  selectedTable: number | null,
  position: number,
  shownAtMs: number,
  previousQuestion: GameQuestion | null,
  remainingTables: number[],
  random: RandomSource,
): GeneratedQuestion {
  const tableChoice = takeTable(
    mode,
    selectedTable,
    settings,
    remainingTables,
    previousQuestion,
    random,
  )
  const factorCount = settings.maxFactor - settings.minFactor + 1
  let rightFactor: number

  if (
    factorCount > 1 &&
    previousQuestion !== null &&
    previousQuestion.leftFactor === tableChoice.leftFactor
  ) {
    const candidate = randomInteger(random, settings.minFactor, settings.maxFactor - 1)
    rightFactor = candidate >= previousQuestion.rightFactor ? candidate + 1 : candidate
  } else {
    rightFactor = randomInteger(random, settings.minFactor, settings.maxFactor)
  }

  return {
    question: {
      position,
      leftFactor: tableChoice.leftFactor,
      rightFactor,
      expectedAnswer: tableChoice.leftFactor * rightFactor,
      shownAtMs,
    },
    remainingTables: tableChoice.remainingTables,
  }
}

export function startGame(
  attempt: GameAttempt,
  nowMs: number,
  random: RandomSource,
): GameState {
  assertValidSettings(attempt.settings)

  if (
    attempt.mode === 'single_table' &&
    (attempt.selectedTable === null || !attempt.settings.enabledTables.includes(attempt.selectedTable))
  ) {
    throw new Error('Cette table n’est pas active.')
  }
  if (attempt.mode === 'all_tables' && attempt.selectedTable !== null) {
    throw new Error('Le mode Toutes les tables ne doit pas recevoir de table unique.')
  }
  if (attempt.endsAtMs <= nowMs) {
    throw new Error('La tentative a expiré avant le démarrage du jeu.')
  }

  const generated = generateGameQuestion(
    attempt.settings,
    attempt.mode,
    attempt.selectedTable,
    1,
    Math.max(nowMs, attempt.startedAtMs),
    null,
    [],
    random,
  )

  return {
    attemptId: attempt.id,
    mode: attempt.mode,
    selectedTable: attempt.selectedTable,
    settings: attempt.settings,
    startedAtMs: attempt.startedAtMs,
    endsAtMs: attempt.endsAtMs,
    finishedAtMs: null,
    status: 'playing',
    question: generated.question,
    feedback: null,
    answers: [],
    score: 0,
    fastStreak: 0,
    bestFastStreak: 0,
    multiplier: 1,
    maxMultiplierReached: 1,
    remainingTables: generated.remainingTables,
  }
}

export function finishExpiredGame(state: GameState, nowMs: number): GameState {
  if (state.status === 'finished' || nowMs < state.endsAtMs) {
    return state
  }

  return {
    ...state,
    status: 'finished',
    question: null,
    feedback: null,
    finishedAtMs: state.endsAtMs,
  }
}

function getNextMultiplier(
  currentMultiplier: number,
  nextFastStreak: number,
  settings: GameSettingsSnapshot,
): number {
  if (nextFastStreak < settings.fastAnswersForMultiplier) {
    return 1
  }
  if (nextFastStreak === settings.fastAnswersForMultiplier) {
    return Math.min(2, settings.maxMultiplier)
  }
  return Math.min(currentMultiplier + 1, settings.maxMultiplier)
}

export function submitAnswer(
  state: GameState,
  submittedAnswer: number,
  nowMs: number,
): SubmitAnswerResult {
  if (state.status !== 'playing' || state.question === null) {
    return { accepted: false, expired: state.status === 'finished', state }
  }
  if (nowMs >= state.endsAtMs) {
    return { accepted: false, expired: true, state: finishExpiredGame(state, nowMs) }
  }

  const responseTimeMs = Math.max(0, Math.floor(nowMs - state.question.shownAtMs))
  const isCorrect = submittedAnswer === state.question.expectedAnswer
  const wasFast = isCorrect && responseTimeMs <= state.settings.fastAnswerLimitMs
  const pointsAwarded = isCorrect ? state.multiplier : 0
  const nextFastStreak = wasFast ? state.fastStreak + 1 : 0
  const nextMultiplier = wasFast
    ? getNextMultiplier(state.multiplier, nextFastStreak, state.settings)
    : 1

  return {
    accepted: true,
    expired: false,
    state: {
      ...state,
      status: 'feedback',
      answers: [
        ...state.answers,
        {
          position: state.question.position,
          leftFactor: state.question.leftFactor,
          rightFactor: state.question.rightFactor,
          submittedAnswer,
          isCorrect,
          responseTimeMs,
          wasFast,
          multiplierApplied: state.multiplier,
          pointsAwarded,
          shownAtMs: state.question.shownAtMs,
          answeredAtMs: nowMs,
        },
      ],
      score: state.score + pointsAwarded,
      fastStreak: nextFastStreak,
      bestFastStreak: Math.max(state.bestFastStreak, nextFastStreak),
      multiplier: nextMultiplier,
      feedback: {
        kind: !isCorrect ? 'wrong' : wasFast ? 'correct_fast' : 'correct_slow',
        pointsAwarded,
        expectedAnswer: state.question.expectedAnswer,
        submittedAnswer,
        multiplierApplied: state.multiplier,
      },
    },
  }
}

export function advanceQuestion(
  state: GameState,
  nowMs: number,
  random: RandomSource,
): GameState {
  if (state.status !== 'feedback') {
    return state
  }
  if (nowMs >= state.endsAtMs) {
    return finishExpiredGame(state, nowMs)
  }

  const generated = generateGameQuestion(
    state.settings,
    state.mode,
    state.selectedTable,
    state.answers.length + 1,
    nowMs,
    state.question,
    state.remainingTables,
    random,
  )

  return {
    ...state,
    status: 'playing',
    feedback: null,
    question: generated.question,
    remainingTables: generated.remainingTables,
    maxMultiplierReached: Math.max(state.maxMultiplierReached, state.multiplier),
  }
}

export function getRemainingGameTimeMs(state: GameState, nowMs: number): number {
  return Math.max(0, state.endsAtMs - nowMs)
}

export function getRemainingFastTimeMs(state: GameState, nowMs: number): number {
  if (state.status !== 'playing' || state.question === null) {
    return 0
  }
  return Math.max(0, state.settings.fastAnswerLimitMs - (nowMs - state.question.shownAtMs))
}
