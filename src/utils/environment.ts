export interface SupabaseConfiguration {
  url: string
  anonKey: string
  isConfigured: boolean
  issue: string | null
}

const PLACEHOLDER_VALUES = ['votre-projet', 'votre-cle-publique']

export function validateSupabaseConfiguration(
  rawUrl: string | undefined,
  rawAnonKey: string | undefined,
): SupabaseConfiguration {
  const url = rawUrl?.trim() ?? ''
  const anonKey = rawAnonKey?.trim() ?? ''

  if (!url || !anonKey) {
    return {
      url,
      anonKey,
      isConfigured: false,
      issue: 'La connexion à Supabase doit être configurée dans le fichier .env.',
    }
  }

  if (PLACEHOLDER_VALUES.some((placeholder) => url.includes(placeholder) || anonKey.includes(placeholder))) {
    return {
      url,
      anonKey,
      isConfigured: false,
      issue: 'Les valeurs Supabase de démonstration doivent être remplacées dans le fichier .env.',
    }
  }

  try {
    const parsedUrl = new URL(url)
    if (parsedUrl.protocol !== 'https:' && parsedUrl.hostname !== 'localhost') {
      throw new Error('invalid protocol')
    }
  } catch {
    return {
      url,
      anonKey,
      isConfigured: false,
      issue: 'VITE_SUPABASE_URL doit contenir une URL Supabase valide.',
    }
  }

  return { url, anonKey, isConfigured: true, issue: null }
}

export const supabaseConfiguration = validateSupabaseConfiguration(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)
