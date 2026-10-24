import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { GameSettingsSnapshot } from '../models/Game'
import { AllTablesGamePage, SingleTableGamePage } from './SingleTableGamePage'

const settings: GameSettingsSnapshot = {
  gameDurationSeconds: 60,
  fastAnswerLimitMs: 3_000,
  fastAnswersForMultiplier: 4,
  maxMultiplier: 10,
  minFactor: 1,
  maxFactor: 10,
  enabledTables: [3],
  feedbackDurationMs: 500,
  leaderboardSize: 5,
  settingsUpdatedAt: '2026-10-24T10:00:00.000Z',
}

const { createGameAttempt } = vi.hoisted(() => ({
  createGameAttempt: vi.fn(),
}))

vi.mock('../services/gameService', () => ({
  createGameAttempt,
  saveGame: vi.fn(),
}))

describe('SingleTableGamePage', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    createGameAttempt.mockImplementation(async (mode: 'single_table' | 'all_tables', selectedTable: number | null) => {
      const startedAtMs = Date.now()
      return {
        id: '11111111-1111-4111-8111-111111111111',
        mode,
        selectedTable,
        startedAtMs,
        endsAtMs: startedAtMs + 60_000,
        settings,
      }
    })
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    createGameAttempt.mockClear()
  })

  it('démarre sur action explicite et valide au clavier avec une saisie tactile', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/eleve/jeu/une-table/3']}>
        <Routes>
          <Route path="/eleve/jeu/une-table/:table" element={<SingleTableGamePage />} />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Démarrer' }))
    const input = await screen.findByRole('textbox', { name: 'Ta réponse numérique' })

    expect(input).toHaveAttribute('inputmode', 'numeric')
    expect(input).toHaveFocus()
    expect(screen.getByText('3 × 1 = ?')).toBeInTheDocument()
    const stats = screen.getByRole('complementary', { name: 'Informations de la partie' })
    for (const label of ['Temps', 'Score', 'Coef.', 'Série']) {
      expect(within(stats).getByText(label)).toBeInTheDocument()
    }

    await user.type(input, '3{Enter}')

    expect(await screen.findByText('Bravo ! +1')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Ta réponse numérique' })).toBe(input)
    expect(input).toHaveFocus()
    expect(createGameAttempt).toHaveBeenCalledWith('single_table', 3)
  })

  it('garde le clavier focalisé après une validation tactile', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/eleve/jeu/une-table/3']}>
        <Routes>
          <Route path="/eleve/jeu/une-table/:table" element={<SingleTableGamePage />} />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Démarrer' }))
    const input = await screen.findByRole('textbox', { name: 'Ta réponse numérique' })
    await user.type(input, '3')
    await user.click(screen.getByRole('button', { name: 'Valider' }))

    expect(await screen.findByText('Bravo ! +1')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Ta réponse numérique' })).toBe(input)
    expect(input).toHaveFocus()
  })

  it('démarre le mode Toutes les tables avec le même écran', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/eleve/jeu/toutes-les-tables']}>
        <Routes>
          <Route path="/eleve/jeu/toutes-les-tables" element={<AllTablesGamePage />} />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Démarrer' }))

    expect(await screen.findByText(/Q1 · Mix/)).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Ta réponse numérique' })).toHaveFocus()
    expect(createGameAttempt).toHaveBeenCalledWith('all_tables', null)
  })
})
