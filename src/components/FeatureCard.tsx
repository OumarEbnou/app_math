import { Box, Paper, Typography } from '@mui/material'
import type { ReactNode } from 'react'

interface FeatureCardProps {
  emoji: string
  title: string
  description?: string
  accent: 'purple' | 'orange' | 'green'
  action?: ReactNode
}

const accentClasses: Record<FeatureCardProps['accent'], string> = {
  purple: 'bg-purple-100 text-purple-800',
  orange: 'bg-orange-100 text-orange-800',
  green: 'bg-emerald-100 text-emerald-800',
}

export function FeatureCard({ emoji, title, description, accent, action }: FeatureCardProps) {
  return (
    <Paper className="h-full border border-white/70 p-4 shadow-[0_12px_32px_rgba(72,45,125,0.08)] sm:p-6">
      <Box
        className={`mb-3 grid size-11 place-items-center rounded-xl text-xl sm:mb-5 sm:size-14 sm:rounded-2xl sm:text-2xl ${accentClasses[accent]}`}
        aria-hidden="true"
      >
        {emoji}
      </Box>
      <Typography variant="h6" component="h2" gutterBottom>
        {title}
      </Typography>
      {description && <Typography color="text.secondary">{description}</Typography>}
      {action && <Box sx={{ mt: description ? 3 : 2 }}>{action}</Box>}
    </Paper>
  )
}
