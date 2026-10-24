import axios from 'axios'

/**
 * Client HTTP unique réservé aux services externes ou aux fonctions qui ne sont
 * pas appelées avec le SDK Supabase. Aucun secret n’est ajouté automatiquement.
 */
export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL?.trim() || undefined,
  timeout: 10_000,
  headers: {
    Accept: 'application/json',
  },
})
