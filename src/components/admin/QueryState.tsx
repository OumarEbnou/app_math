import { Alert, Box, Button, CircularProgress, Paper, Typography } from '@mui/material'

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
          <Button color="inherit" size="small" onClick={onRetry}>
            Réessayer
          </Button>
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
