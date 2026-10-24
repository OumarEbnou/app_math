import { describe, expect, it } from 'vitest'
import type { GameAttempt, GameSettingsSnapshot, GameState } from '../models/Game'
import { advanceQuestion, finishExpiredGame, startGame, submitAnswer } from './gameEngine'

const settings: GameSettingsSnapshot = {
  gameDurationSeconds: 20,
  fastAnswerLimitMs: 3_000,
  fastAnswersForMultiplier: 4,
  maxMultiplier: 5,
  minFactor: 1,
  maxFactor: 4,
  enabledTables: [2, 3, 5],
  feedbackDurationMs: 300,
  leaderboardSize: 5,
  settingsUpdatedAt: '2026-10-24T10:00:00.000Z',
}

function createAllTablesGame(random = () => 0.5): GameState {
  const attempt: GameAttempt = {
    id: '22222222-2222-4222-8222-222222222222',
    mode: 'all_tables',
    selectedTable: null,
    startedAtMs: 1_000,
    endsAtMs: 21_000,
    settings,
  }
  return startGame(attempt, 1_000, random)
}

function answerAndAdvance(state: GameState, random = () => 0.5): GameState {
  const answeredAt = (state.question?.shownAtMs ?? 0) + 500
  const result = submitAnswer(state, state.question?.expectedAnswer ?? -1, answeredAt)
  return advanceQuestion(result.state, answeredAt + 10, random)
}

describe('gameEngine · Toutes les tables', () => {
  it('mélange toutes les tables actives par cycles raisonnablement répartis', () => {
    let game = createAllTablesGame(() => 0.25)
    const tables: number[] = []

    for (let index = 0; index < 6; index += 1) {
      tables.push(game.question!.leftFactor)
      game = answerAndAdvance(game, () => 0.75)
    }

    expect(new Set(tables.slice(0, 3))).toEqual(new Set([2, 3, 5]))
    expect(new Set(tables.slice(3, 6))).toEqual(new Set([2, 3, 5]))
    expect(tables.every((table) => settings.enabledTables.includes(table))).toBe(true)
  })

  it('évite deux opérations identiques de suite', () => {
    let game = createAllTablesGame(() => 0)
    const operations: string[] = []
    for (let index = 0; index < 10; index += 1) {
      operations.push(`${game.question!.leftFactor}x${game.question!.rightFactor}`)
      game = answerAndAdvance(game, () => 0)
    }

    for (let index = 1; index < operations.length; index += 1) {
      expect(operations[index]).not.toBe(operations[index - 1])
    }
  })

  it('varie le facteur même si une seule table est active', () => {
    const oneTableSettings = { ...settings, enabledTables: [3] }
    let game = startGame(
      {
        id: '44444444-4444-4444-8444-444444444444',
        mode: 'all_tables',
        selectedTable: null,
        startedAtMs: 1_000,
        endsAtMs: 21_000,
        settings: oneTableSettings,
      },
      1_000,
      () => 0,
    )
    const firstOperation = `${game.question!.leftFactor}x${game.question!.rightFactor}`
    game = answerAndAdvance(game, () => 0)

    expect(`${game.question!.leftFactor}x${game.question!.rightFactor}`).not.toBe(firstOperation)
  })

  it('applique exactement le même score et les mêmes multiplicateurs', () => {
    let game = createAllTablesGame()
    for (let index = 0; index < 5; index += 1) {
      game = answerAndAdvance(game)
    }

    expect(game.answers.map((answer) => answer.multiplierApplied)).toEqual([1, 1, 1, 1, 2])
    expect(game.score).toBe(6)
    expect(game.multiplier).toBe(3)
    expect(finishExpiredGame(game, 21_000).status).toBe('finished')
  })

  it('conserve une séparation stricte entre les états des deux modes', () => {
    const allTables = createAllTablesGame()
    const singleTable = startGame(
      {
        id: '33333333-3333-4333-8333-333333333333',
        mode: 'single_table',
        selectedTable: 3,
        startedAtMs: 1_000,
        endsAtMs: 21_000,
        settings,
      },
      1_000,
      () => 0.5,
    )

    expect(allTables).toMatchObject({ mode: 'all_tables', selectedTable: null })
    expect(singleTable).toMatchObject({ mode: 'single_table', selectedTable: 3 })
    expect(singleTable.question?.leftFactor).toBe(3)
  })
})
