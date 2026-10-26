import { render, screen } from '@testing-library/react'
import type { User } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthContext, type AuthContextValue } from '../context/AuthContext'
import type { Profile } from '../models/Profile'
import { ProtectedRoute } from './ProtectedRoute'

const adminProfile: Profile = {
  id: '00000000-0000-4000-8000-000000000001',
  role: 'admin',
  username: 'admin_test',
  display_name: 'Admin',
  is_active: true,
  created_at: '2026-10-23T00:00:00.000Z',
  updated_at: '2026-10-23T00:00:00.000Z',
}

function renderProtectedRoute(profile: Profile | null) {
  const value: AuthContextValue = {
    status: 'ready',
    user: profile ? ({ id: profile.id } as User) : null,
    profile,
    error: null,
    isConfigured: true,
    signIn: async () => adminProfile,
    signOut: async () => undefined,
    clearError: () => undefined,
  }

  render(
    <AuthContext.Provider value={value}>
      <MemoryRouter initialEntries={['/admin/eleves']}>
        <Routes>
          <Route
            path="/admin/eleves"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <p>Espace administrateur</p>
              </ProtectedRoute>
            }
          />
          <Route path="/connexion" element={<p>Connexion requise</p>} />
          <Route path="/interdit" element={<p>Accès interdit</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )
}

describe('ProtectedRoute', () => {
  it('autorise un administrateur sur une route admin', () => {
    renderProtectedRoute(adminProfile)
    expect(screen.getByText('Espace administrateur')).toBeVisible()
  })

  it('refuse une route admin à un élève', () => {
    renderProtectedRoute({ ...adminProfile, role: 'student' })
    expect(screen.getByText('Accès interdit')).toBeVisible()
  })

  it('redirige une personne déconnectée vers la connexion', () => {
    renderProtectedRoute(null)
    expect(screen.getByText('Connexion requise')).toBeVisible()
  })
})
