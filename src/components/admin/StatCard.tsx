import { Box, Paper, Typography } from '@mui/material'

interface StatCardProps {
  label: string
  value: number | string
  emoji: string
  helper: string
}

export function StatCard({ label, value, emoji, helper }: StatCardProps) {
  return (
    <Paper className="border border-white/80 p-5 shadow-[0_12px_35px_rgba(72,45,125,0.08)]">
      <Box className="flex items-start justify-between gap-4">
        <Box>
          <Typography color="text.secondary" sx={{ fontSize: 14, fontWeight: 800 }}>
            {label}
          </Typography>
          <Typography variant="h3" component="p" sx={{ mt: 0.5 }}>
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {helper}
          </Typography>
        </Box>
        <Box
          aria-hidden="true"
          className="grid size-12 shrink-0 place-items-center rounded-2xl bg-purple-100 text-2xl"
        >
          {emoji}
        </Box>
      </Box>
    </Paper>
  )
}
