import { createContext } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '../models/Profile'
import type { LoginCredentials } from '../services/authService'
import type { AuthStatus } from '../types/auth'

export interface AuthContextValue {
  status: AuthStatus
  user: User | null
  profile: Profile | null
  error: string | null
  isConfigured: boolean
  signIn: (credentials: LoginCredentials) => Promise<Profile>
  signOut: () => Promise<void>
  clearError: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
