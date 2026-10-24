import type {
  GameSettingsSnapshot,
  SingleTableAttempt,
  SingleTableGameState,
} from '../models/Game'
import {
  advanceQuestion,
  finishExpiredGame as finishGame,
  generateGameQuestion,
  getRemainingFastTimeMs,
  getRemainingGameTimeMs,
  startGame,
  submitAnswer,
  type RandomSource,
} from './gameEngine'

export { getRemainingFastTimeMs, getRemainingGameTimeMs }
export type { RandomSource }

export function generateSingleTableQuestion(
  settings: GameSettingsSnapshot,
  selectedTable: number,
  position: number,
  shownAtMs: number,
  previousRightFactor: number | null,
  random: RandomSource,
) {
  return generateGameQuestion(
    settings,
    'single_table',
    selectedTable,
    position,
    shownAtMs,
    previousRightFactor === null
      ? null
      : {
          position: position - 1,
          leftFactor: selectedTable,
          rightFactor: previousRightFactor,
          expectedAnswer: selectedTable * previousRightFactor,
          shownAtMs,
        },
    [],
    random,
  ).question
}

export function startSingleTableGame(
  attempt: SingleTableAttempt,
  nowMs: number,
  random: RandomSource,
): SingleTableGameState {
  return startGame(attempt, nowMs, random) as SingleTableGameState
}

export function finishExpiredGame(
  state: SingleTableGameState,
  nowMs: number,
): SingleTableGameState {
  return finishGame(state, nowMs) as SingleTableGameState
}

export function submitSingleTableAnswer(
  state: SingleTableGameState,
  submittedAnswer: number,
  nowMs: number,
): { accepted: boolean; expired: boolean; state: SingleTableGameState } {
  const result = submitAnswer(state, submittedAnswer, nowMs)
  return { ...result, state: result.state as SingleTableGameState }
}

export function advanceSingleTableQuestion(
  state: SingleTableGameState,
  nowMs: number,
  random: RandomSource,
): SingleTableGameState {
  return advanceQuestion(state, nowMs, random) as SingleTableGameState
}
