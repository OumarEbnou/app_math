import { Alert, Box, CircularProgress, IconButton, Paper, Tooltip, Typography } from '@mui/material'
import { AppIcon } from '../AppIcon'

export function SectionLoader({ label = 'Chargement des données…' }: { label?: string }) {
  return (
    <Box className="flex min-h-48 items-center justify-center gap-3" role="status">
      <CircularProgress size={30} />
      <Typography color="text.secondary">{label}</Typography>
    </Box>
  )
}

export function QueryError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Alert
      severity="error"
      action={
        onRetry ? (
          <Tooltip title="Réessayer">
            <IconButton color="inherit" size="small" onClick={onRetry} aria-label="Réessayer">
              <AppIcon name="replay" size={20} />
            </IconButton>
          </Tooltip>
        ) : undefined
      }
    >
      {message}
    </Alert>
  )
}

export function EmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <Paper variant="outlined" className="p-8 text-center">
      <Typography variant="h6" component="h2" gutterBottom>
        {title}
      </Typography>
      <Typography color="text.secondary">{description}</Typography>
    </Paper>
  )
}
