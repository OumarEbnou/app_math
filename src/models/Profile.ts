import type { AppRole } from '../types/auth'

export interface Profile {
  id: string
  role: AppRole
  username: string
  display_name: string
  is_active: boolean
  created_at: string
  updated_at: string
}
