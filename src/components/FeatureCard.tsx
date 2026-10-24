import { Box, Paper, Typography } from '@mui/material'
import type { ReactNode } from 'react'

interface FeatureCardProps {
  emoji: string
  title: string
  description: string
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
    <Paper className="h-full border border-white/70 p-6 shadow-[0_16px_45px_rgba(72,45,125,0.09)]">
      <Box
        className={`mb-5 grid size-14 place-items-center rounded-2xl text-2xl ${accentClasses[accent]}`}
        aria-hidden="true"
      >
        {emoji}
      </Box>
      <Typography variant="h6" component="h2" gutterBottom>
        {title}
      </Typography>
      <Typography color="text.secondary">{description}</Typography>
      {action && <Box sx={{ mt: 3 }}>{action}</Box>}
    </Paper>
  )
}
