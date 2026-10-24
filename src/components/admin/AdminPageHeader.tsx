import type { ReactNode } from 'react'
import { Box, Typography } from '@mui/material'

interface AdminPageHeaderProps {
  eyebrow?: string
  title: string
  description: string
  action?: ReactNode
}

export function AdminPageHeader({
  eyebrow = 'Administration',
  title,
  description,
  action,
}: AdminPageHeaderProps) {
  return (
    <Box className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <Box>
        <Typography
          component="p"
          color="primary"
          sx={{ fontSize: 13, fontWeight: 900, letterSpacing: 1.2, textTransform: 'uppercase' }}
        >
          {eyebrow}
        </Typography>
        <Typography variant="h3" component="h1" gutterBottom>
          {title}
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 720, fontSize: 17 }}>
          {description}
        </Typography>
      </Box>
      {action && <Box className="shrink-0">{action}</Box>}
    </Box>
  )
}
