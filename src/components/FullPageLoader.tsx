import { Box, CircularProgress, Typography } from '@mui/material'

interface FullPageLoaderProps {
  label?: string
}

export function FullPageLoader({ label = 'Chargement…' }: FullPageLoaderProps) {
  return (
    <Box className="grid min-h-screen place-items-center bg-amber-50 px-6">
      <Box className="flex flex-col items-center gap-4" role="status" aria-live="polite">
        <CircularProgress size={42} />
        <Typography color="text.secondary">{label}</Typography>
      </Box>
    </Box>
  )
}
