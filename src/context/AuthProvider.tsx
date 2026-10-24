import { useCallback, useEffect, useMemo, useRef, useState, type PropsWithChildren } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '../models/Profile'
import {
  getCurrentSession,
  getProfile,
  onAuthStateChange,
  signInWithPassword,
  signOutCurrentUser,
  type LoginCredentials,
} from '../services/authService'
import { supabaseConfiguration } from '../utils/environment'
import { getErrorMessage } from '../utils/errors'
import { AuthContext, type AuthContextValue } from './AuthContext'

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthContextValue['status']>(
    supabaseConfiguration.isConfigured ? 'loading' : 'ready',
  )
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError] = useState<string | null>(supabaseConfiguration.issue)
  const explicitSignOutRef = useRef(false)

  const clearSession = useCallback(() => {
    setUser(null)
    setProfile(null)
  }, [])

  const hydrateUser = useCallback(async (nextUser: User): Promise<Profile> => {
    const nextProfile = await getProfile(nextUser.id)

    if (!nextProfile.is_active) {
      await signOutCurrentUser()
      throw new Error('Ce compte a été désactivé. Contactez votre administrateur.')
    }

    setUser(nextUser)
    setProfile(nextProfile)
    return nextProfile
  }, [])

  useEffect(() => {
    if (!supabaseConfiguration.isConfigured) {
      return
    }

    let isMounted = true

    const restoreSession = async () => {
      try {
        const session = await getCurrentSession()
        if (session?.user && isMounted) {
          await hydrateUser(session.user)
        }
      } catch (restoreError) {
        if (isMounted) {
          clearSession()
          setError(getErrorMessage(restoreError))
        }
      } finally {
        if (isMounted) {
          setStatus('ready')
        }
      }
    }

    void restoreSession()

    const unsubscribe = onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' && isMounted) {
        clearSession()
        if (!explicitSignOutRef.current) {
          setError('Votre session a expiré. Connectez-vous de nouveau.')
        }
      }
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [clearSession, hydrateUser])

  const signIn = useCallback(
    async (credentials: LoginCredentials): Promise<Profile> => {
      setError(null)
      try {
        const authenticatedUser = await signInWithPassword(credentials)
        return await hydrateUser(authenticatedUser)
      } catch (signInError) {
        clearSession()
        const message = getErrorMessage(signInError)
        setError(message)
        throw new Error(message)
      }
    },
    [clearSession, hydrateUser],
  )

  const signOut = useCallback(async () => {
    setError(null)
    explicitSignOutRef.current = true
    try {
      await signOutCurrentUser()
      clearSession()
    } catch (signOutError) {
      const message = getErrorMessage(signOutError)
      setError(message)
      throw new Error(message)
    } finally {
      explicitSignOutRef.current = false
    }
  }, [clearSession])

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      profile,
      error,
      isConfigured: supabaseConfiguration.isConfigured,
      signIn,
      signOut,
      clearError: () => setError(null),
    }),
    [error, profile, signIn, signOut, status, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
