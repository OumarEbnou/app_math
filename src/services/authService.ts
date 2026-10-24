import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js'
import type { Profile } from '../models/Profile'
import { getSupabaseClient } from './supabaseClient'

export interface LoginCredentials {
  email: string
  password: string
}

export async function signInWithPassword(credentials: LoginCredentials): Promise<User> {
  const client = getSupabaseClient()
  const { data, error } = await client.auth.signInWithPassword(credentials)

  if (error) {
    throw new Error('Identifiant ou mot de passe incorrect.')
  }

  if (!data.user) {
    throw new Error('La connexion n’a pas pu être établie.')
  }

  return data.user
}

export async function signOutCurrentUser(): Promise<void> {
  const client = getSupabaseClient()
  const { error } = await client.auth.signOut()

  if (error) {
    throw new Error('La déconnexion a échoué. Veuillez réessayer.')
  }
}

export async function getCurrentSession(): Promise<Session | null> {
  const client = getSupabaseClient()
  const { data, error } = await client.auth.getSession()

  if (error) {
    throw new Error('Impossible de restaurer la session.')
  }

  return data.session
}

export async function getProfile(userId: string): Promise<Profile> {
  const client = getSupabaseClient()
  const { data, error } = await client
    .from('profiles')
    .select('id, role, display_name, is_active, created_at, updated_at')
    .eq('id', userId)
    .single()

  if (error || !data) {
    throw new Error('Le profil associé à ce compte est introuvable.')
  }

  return data as Profile
}

export function onAuthStateChange(
  listener: (event: AuthChangeEvent, session: Session | null) => void,
): () => void {
  const client = getSupabaseClient()
  const { data } = client.auth.onAuthStateChange(listener)

  return () => data.subscription.unsubscribe()
}
