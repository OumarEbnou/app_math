import { Box, Typography } from '@mui/material'

interface BrandMarkProps {
  compact?: boolean
}

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <Box className="flex items-center gap-3" aria-label="Multipli’Champions">
      <Box
        aria-hidden="true"
        className="grid size-11 place-items-center rounded-2xl bg-orange-400 text-2xl shadow-sm"
      >
        ×
      </Box>
      {!compact && (
        <Typography component="span" variant="h6" sx={{ fontWeight: 900 }} color="primary.dark">
          Multipli’Champions
        </Typography>
      )}
    </Box>
  )
}
