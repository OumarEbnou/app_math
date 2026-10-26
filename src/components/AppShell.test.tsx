import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { User } from '@supabase/supabase-js'
import { afterEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AuthContext, type AuthContextValue } from '../context/AuthContext'
import type { Profile } from '../models/Profile'
import { AppShell } from './AppShell'

const studentProfile: Profile = {
  id: '00000000-0000-4000-8000-000000000001',
  role: 'student',
  username: 'etoile',
  display_name: 'Étoile',
  is_active: true,
  created_at: '2026-10-24T10:00:00.000Z',
  updated_at: '2026-10-24T10:00:00.000Z',
}

function renderShell(profile: Profile) {
  const context: AuthContextValue = {
    status: 'ready',
    user: { id: profile.id } as User,
    profile,
    error: null,
    isConfigured: true,
    signIn: async () => profile,
    signOut: async () => undefined,
    clearError: () => undefined,
  }

  render(
    <AuthContext.Provider value={context}>
      <MemoryRouter initialEntries={['/eleve/historique']}>
        <AppShell>
          <h1>Mon historique</h1>
        </AppShell>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

afterEach(cleanup)

describe('AppShell accessible', () => {
  it('fournit un lien d’évitement, un contenu principal focalisable et la page active', () => {
    renderShell(studentProfile)

    expect(screen.getByRole('link', { name: 'Aller au contenu principal' })).toHaveAttribute(
      'href',
      '#main-content',
    )
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content')
    expect(screen.getByRole('main')).toHaveFocus()
    expect(screen.getByRole('link', { name: 'Scores' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(screen.getByRole('button', { name: 'Se déconnecter' })).toBeInTheDocument()
  })
})
