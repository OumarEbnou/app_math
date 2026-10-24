import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { GameAnswer } from '../models/Game'
import {
  createGameAttempt,
  getGameHistory,
  getLeaderboard,
  saveGame,
} from './gameService'

const { from, getSupabaseClient, rpc } = vi.hoisted(() => ({
  from: vi.fn(),
  getSupabaseClient: vi.fn(),
  rpc: vi.fn(),
}))

vi.mock('./supabaseClient', () => ({ getSupabaseClient }))

const settingsSnapshot = {
  game_duration_seconds: 60,
  fast_answer_limit_ms: 3000,
  fast_answers_for_multiplier: 4,
  max_multiplier: 10,
  min_factor: 1,
  max_factor: 10,
  enabled_tables: [2, 3],
  feedback_duration_ms: 500,
  leaderboard_size: 5,
  settings_updated_at: '2026-10-24T10:00:00.000Z',
}

describe('gameService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getSupabaseClient.mockReturnValue({ from, rpc } as never)
  })

  it('démarre chaque mode avec les paramètres attendus', async () => {
    rpc.mockResolvedValueOnce({
      data: [
        {
          attempt_id: '11111111-1111-4111-8111-111111111111',
          server_started_at: '2026-10-24T10:00:00.000Z',
          server_ends_at: '2026-10-24T10:01:00.000Z',
          settings_snapshot: settingsSnapshot,
        },
      ],
      error: null,
    })

    const attempt = await createGameAttempt('all_tables', null)

    expect(rpc).toHaveBeenCalledWith('start_game', {
      requested_mode: 'all_tables',
      requested_table: null,
    })
    expect(attempt).toMatchObject({ mode: 'all_tables', selectedTable: null })
  })

  it('envoie les réponses brutes sans faire confiance au score du navigateur', async () => {
    rpc.mockResolvedValueOnce({
      data: [
        {
          session_id: '11111111-1111-4111-8111-111111111111',
          official_score: 1,
          total_questions: 1,
          correct_answers: 1,
          wrong_answers: 0,
          best_fast_streak: 1,
          max_multiplier_reached: 1,
          average_answer_time_ms: 500,
          started_at: '2026-10-24T10:00:00.000Z',
          ended_at: '2026-10-24T10:01:00.000Z',
          created: true,
          ranking_position: 8,
          ranking_size: 12,
          is_personal_best: true,
        },
      ],
      error: null,
    })
    const answer: GameAnswer = {
      position: 1,
      leftFactor: 3,
      rightFactor: 4,
      submittedAnswer: 12,
      isCorrect: true,
      responseTimeMs: 500,
      wasFast: true,
      multiplierApplied: 99,
      pointsAwarded: 99,
      shownAtMs: Date.parse('2026-10-24T10:00:01.000Z'),
      answeredAtMs: Date.parse('2026-10-24T10:00:01.500Z'),
    }

    const result = await saveGame('11111111-1111-4111-8111-111111111111', [answer])

    const payload = rpc.mock.calls[0][1] as {
      requested_answers: Array<Record<string, unknown>>
    }
    expect(payload.requested_answers[0]).not.toHaveProperty('points_awarded')
    expect(payload.requested_answers[0]).not.toHaveProperty('multiplier_applied')
    expect(payload.requested_answers[0]).not.toHaveProperty('is_correct')
    expect(result).toMatchObject({ officialScore: 1, rankingPosition: 8 })
  })

  it('applique les filtres personnels côté Supabase avant la pagination', async () => {
    const historyResult = {
      data: [
        {
          id: 'session-1',
          mode: 'single_table',
          selected_table: 3,
          score: 14,
          total_questions: 10,
          correct_answers: 9,
          wrong_answers: 1,
          best_fast_streak: 5,
          max_multiplier_reached: 3,
          average_answer_time_ms: 800,
          started_at: '2026-10-24T10:00:00.000Z',
          ended_at: '2026-10-24T10:01:00.000Z',
        },
      ],
      count: 1,
      error: null,
    }
    const bestResult = { data: [{ score: 14 }], error: null }
    const historyBuilder = {
      select: vi.fn(),
      order: vi.fn(),
      eq: vi.fn(),
      range: vi.fn().mockResolvedValue(historyResult),
    }
    historyBuilder.select.mockReturnValue(historyBuilder)
    historyBuilder.order.mockReturnValue(historyBuilder)
    historyBuilder.eq.mockReturnValue(historyBuilder)
    const bestBuilder = {
      select: vi.fn(),
      order: vi.fn(),
      eq: vi.fn(),
      limit: vi.fn(),
      then: (
        onFulfilled: (value: typeof bestResult) => unknown,
        onRejected?: (reason: unknown) => unknown,
      ) => Promise.resolve(bestResult).then(onFulfilled, onRejected),
    }
    bestBuilder.select.mockReturnValue(bestBuilder)
    bestBuilder.order.mockReturnValue(bestBuilder)
    bestBuilder.eq.mockReturnValue(bestBuilder)
    bestBuilder.limit.mockReturnValue(bestBuilder)
    from.mockReturnValueOnce(historyBuilder as never).mockReturnValueOnce(bestBuilder as never)

    const page = await getGameHistory({
      mode: 'single_table',
      selectedTable: 3,
      page: 0,
      pageSize: 10,
    })

    expect(historyBuilder.eq).toHaveBeenCalledWith('mode', 'single_table')
    expect(historyBuilder.eq).toHaveBeenCalledWith('selected_table', 3)
    expect(historyBuilder.order).toHaveBeenCalledWith('ended_at', { ascending: false })
    expect(page).toMatchObject({ total: 1, bestScore: 14 })
  })

  it('charge uniquement les colonnes publiques du classement sécurisé', async () => {
    rpc.mockResolvedValueOnce({
      data: [
        {
          position: 1,
          display_name: 'Étoile',
          score: 42,
          ended_at: '2026-10-24T10:01:00.000Z',
        },
      ],
      error: null,
    })

    const entries = await getLeaderboard('single_table', 3)

    expect(rpc).toHaveBeenCalledWith('get_public_leaderboard', {
      requested_mode: 'single_table',
      requested_table: 3,
    })
    expect(entries).toEqual([
      {
        position: 1,
        displayName: 'Étoile',
        score: 42,
        endedAt: '2026-10-24T10:01:00.000Z',
      },
    ])
  })
})
