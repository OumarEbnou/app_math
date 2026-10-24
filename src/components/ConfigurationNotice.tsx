import { Alert, AlertTitle } from '@mui/material'
import { supabaseConfiguration } from '../utils/environment'

export function ConfigurationNotice() {
  if (supabaseConfiguration.isConfigured) {
    return null
  }

  return (
    <Alert severity="warning">
      <AlertTitle>Configuration requise</AlertTitle>
      {supabaseConfiguration.issue} Copiez <strong>.env.example</strong> vers{' '}
      <strong>.env</strong>, puis renseignez les deux valeurs publiques du projet.
    </Alert>
  )
}
