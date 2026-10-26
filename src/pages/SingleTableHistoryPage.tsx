import {
  Box,
  Button,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { EmptyState, QueryError, SectionLoader } from '../components/admin/QueryState'
import { AppIcon } from '../components/AppIcon'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { getPersonalBestScores } from '../services/gameService'
import { formatDate } from '../utils/formatters'

export function SingleTableHistoryPage() {
  useDocumentTitle('Scores')
  const historyQuery = useQuery({
    queryKey: ['personal-best-scores'],
    queryFn: () => getPersonalBestScores(5),
    refetchOnMount: 'always',
  })

  return (
    <Stack spacing={{ xs: 2, sm: 3 }}>
      <Box className="flex items-center justify-between gap-3">
        <Typography variant="h4" component="h1">
          Scores
        </Typography>
        <Button component={Link} to="/eleve" variant="contained" size="small" aria-label="Jouer">
          <AppIcon name="play" />
        </Button>
      </Box>

      {historyQuery.isPending ? (
        <SectionLoader label="Chargement de ton historique…" />
      ) : historyQuery.isError || !historyQuery.data ? (
        <QueryError
          message="Ton historique n’a pas pu être chargé."
          onRetry={() => void historyQuery.refetch()}
        />
      ) : historyQuery.data.length === 0 ? (
        <EmptyState
          title="Aucun score"
          description="Joue une première partie pour remplir ton top 5."
        />
      ) : (
        <Stack component="ol" spacing={1.5} sx={{ m: 0, p: 0, listStyle: 'none' }}>
          {historyQuery.data.map((session, index) => (
            <Paper
              key={session.id}
              component="li"
              variant="outlined"
              className="overflow-hidden"
              sx={{ borderColor: index === 0 ? 'primary.light' : 'divider' }}
            >
              <Box className="flex min-h-16 items-center gap-3 p-3 sm:min-h-20 sm:gap-4 sm:p-4">
                <Box
                  aria-label={`Position ${index + 1}`}
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-purple-100 text-lg font-black text-purple-800 sm:size-12 sm:text-xl"
                >
                  {index + 1}
                </Box>
                <Box className="min-w-0 flex-1">
                  <Typography color="text.secondary" variant="body2">
                    {formatDate(session.endedAt)}
                  </Typography>
                </Box>
                <Typography variant="h5" component="p" color="primary.main" sx={{ fontWeight: 900 }}>
                  {session.score} pts
                </Typography>
              </Box>
            </Paper>
          ))}
        </Stack>
      )}
    </Stack>
  )
}
