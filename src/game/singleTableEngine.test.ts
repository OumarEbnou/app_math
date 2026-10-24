import { describe, expect, it } from 'vitest'
import type { GameSettingsSnapshot, SingleTableAttempt, SingleTableGameState } from '../models/Game'
import {
  advanceSingleTableQuestion,
  finishExpiredGame,
  generateSingleTableQuestion,
  startSingleTableGame,
  submitSingleTableAnswer,
} from './singleTableEngine'

const defaultSettings: GameSettingsSnapshot = {
  gameDurationSeconds: 60,
  fastAnswerLimitMs: 3_000,
  fastAnswersForMultiplier: 4,
  maxMultiplier: 10,
  minFactor: 1,
  maxFactor: 10,
  enabledTables: [3, 4],
  feedbackDurationMs: 500,
  leaderboardSize: 5,
  settingsUpdatedAt: '2026-10-23T10:00:00.000Z',
}

function createGame(settings = defaultSettings): SingleTableGameState {
  const attempt: SingleTableAttempt = {
    id: '11111111-1111-4111-8111-111111111111',
    mode: 'single_table',
    selectedTable: 3,
    startedAtMs: 1_000,
    endsAtMs: 1_000 + settings.gameDurationSeconds * 1_000,
    settings,
  }
  return startSingleTableGame(attempt, 1_000, () => 0)
}

function answerCorrectAndAdvance(
  state: SingleTableGameState,
  answeredAtMs: number,
): SingleTableGameState {
  const submitted = submitSingleTableAnswer(
    state,
    state.question?.expectedAnswer ?? -1,
    answeredAtMs,
  )
  expect(submitted.accepted).toBe(true)
  return advanceSingleTableQuestion(submitted.state, answeredAtMs + 10, () => 0.5)
}

describe('singleTableEngine', () => {
  it('accorde un point pour une bonne réponse rapide à ×1', () => {
    const game = createGame()
    const result = submitSingleTableAnswer(game, game.question!.expectedAnswer, 2_000)

    expect(result.state.score).toBe(1)
    expect(result.state.answers[0]).toMatchObject({
      isCorrect: true,
      wasFast: true,
      multiplierApplied: 1,
      pointsAwarded: 1,
    })
  })

  it('déclenche ×2 pour la question suivant la série configurée', () => {
    let game = createGame()
    for (let index = 0; index < 4; index += 1) {
      game = answerCorrectAndAdvance(game, 2_000 + index * 1_000)
    }

    expect(game.fastStreak).toBe(4)
    expect(game.multiplier).toBe(2)
    expect(game.score).toBe(4)
  })

  it('passe de ×2 à ×3 après une nouvelle réponse rapide', () => {
    let game = createGame()
    for (let index = 0; index < 5; index += 1) {
      game = answerCorrectAndAdvance(game, 2_000 + index * 1_000)
    }

    expect(game.answers[4].multiplierApplied).toBe(2)
    expect(game.answers[4].pointsAwarded).toBe(2)
    expect(game.multiplier).toBe(3)
  })

  it('ne dépasse jamais le multiplicateur maximal', () => {
    let game = createGame({ ...defaultSettings, fastAnswersForMultiplier: 2, maxMultiplier: 3 })
    for (let index = 0; index < 8; index += 1) {
      game = answerCorrectAndAdvance(game, 2_000 + index * 1_000)
    }

    expect(game.multiplier).toBe(3)
    expect(Math.max(...game.answers.map((answer) => answer.multiplierApplied))).toBe(3)
  })

  it('ne donne aucun point à une mauvaise réponse et remet la question suivante à ×1', () => {
    const game = { ...createGame(), multiplier: 3, fastStreak: 6 }
    const result = submitSingleTableAnswer(game, -1, 2_000)

    expect(result.state.score).toBe(0)
    expect(result.state.multiplier).toBe(1)
    expect(result.state.fastStreak).toBe(0)
    expect(result.state.answers[0].pointsAwarded).toBe(0)
  })

  it('accorde les points actifs à une bonne réponse lente puis remet à ×1', () => {
    const game = { ...createGame(), multiplier: 2, fastStreak: 4 }
    const result = submitSingleTableAnswer(game, game.question!.expectedAnswer, 4_001)

    expect(result.state.answers[0]).toMatchObject({
      isCorrect: true,
      wasFast: false,
      multiplierApplied: 2,
      pointsAwarded: 2,
    })
    expect(result.state.multiplier).toBe(1)
    expect(result.state.fastStreak).toBe(0)
  })

  it('termine la partie sans compter la question en cours à l’expiration générale', () => {
    const game = createGame()
    const finished = finishExpiredGame(game, 61_000)

    expect(finished.status).toBe('finished')
    expect(finished.answers).toHaveLength(0)
    expect(finished.score).toBe(0)
    expect(finished.question).toBeNull()
  })

  it('refuse une seconde validation de la même question', () => {
    const game = createGame()
    const first = submitSingleTableAnswer(game, game.question!.expectedAnswer, 2_000)
    const second = submitSingleTableAnswer(first.state, game.question!.expectedAnswer, 2_100)

    expect(second.accepted).toBe(false)
    expect(second.state.answers).toHaveLength(1)
    expect(second.state.score).toBe(1)
  })

  it('respecte des paramètres différents des valeurs par défaut', () => {
    const settings = {
      ...defaultSettings,
      gameDurationSeconds: 10,
      fastAnswerLimitMs: 500,
      fastAnswersForMultiplier: 2,
      maxMultiplier: 2,
      minFactor: 7,
      maxFactor: 7,
      enabledTables: [3],
    }
    let game = createGame(settings)
    game = answerCorrectAndAdvance(game, 1_400)
    game = answerCorrectAndAdvance(game, 1_900)

    expect(game.question?.rightFactor).toBe(7)
    expect(game.multiplier).toBe(2)
    const slow = submitSingleTableAnswer(game, 21, game.question!.shownAtMs + 501)
    expect(slow.state.answers[2]).toMatchObject({ wasFast: false, pointsAwarded: 2 })
    expect(finishExpiredGame(slow.state, 61_000).status).toBe('finished')
  })

  it('génère uniquement la table choisie et évite une répétition immédiate', () => {
    const first = generateSingleTableQuestion(defaultSettings, 3, 1, 1_000, null, () => 0)
    const second = generateSingleTableQuestion(
      defaultSettings,
      3,
      2,
      2_000,
      first.rightFactor,
      () => 0,
    )

    expect(first.leftFactor).toBe(3)
    expect(second.leftFactor).toBe(3)
    expect(second.rightFactor).not.toBe(first.rightFactor)
  })

  it('joue une partie complète de la table de 3 avec un score vérifiable', () => {
    const settings = {
      ...defaultSettings,
      gameDurationSeconds: 10,
      fastAnswersForMultiplier: 2,
      maxMultiplier: 3,
      minFactor: 1,
      maxFactor: 3,
      enabledTables: [3],
    }
    let game = createGame(settings)

    game = answerCorrectAndAdvance(game, 1_500)
    game = answerCorrectAndAdvance(game, 2_500)
    game = answerCorrectAndAdvance(game, 3_500)
    const wrong = submitSingleTableAnswer(game, -1, 4_500)
    game = advanceSingleTableQuestion(wrong.state, 4_510, () => 0.8)
    game = finishExpiredGame(game, 11_000)

    expect(game.status).toBe('finished')
    expect(game.answers.map((item) => item.leftFactor)).toEqual([3, 3, 3, 3])
    expect(game.answers.map((item) => item.pointsAwarded)).toEqual([1, 1, 2, 0])
    expect(game.score).toBe(4)
    expect(game.answers).toHaveLength(4)
  })

  it('isole les scores de deux parties complètes successives', () => {
    const firstFinished = finishExpiredGame(
      submitSingleTableAnswer(createGame(), 3, 2_000).state,
      61_000,
    )
    const secondFinished = finishExpiredGame(
      submitSingleTableAnswer(createGame(), -1, 2_000).state,
      61_000,
    )

    expect(firstFinished.score).toBe(1)
    expect(secondFinished.score).toBe(0)
    expect(firstFinished.answers).toHaveLength(1)
    expect(secondFinished.answers).toHaveLength(1)
  })
})
