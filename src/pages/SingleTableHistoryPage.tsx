import {
  Box,
  Button,
  Pagination,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState, QueryError, SectionLoader } from '../components/admin/QueryState'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { getGameHistory } from '../services/gameService'

const pageSize = 20

export function SingleTableHistoryPage() {
  useDocumentTitle('Scores')
  const [page, setPage] = useState(0)
  const historyQuery = useQuery({
    queryKey: ['game-history', 'scores', page],
    queryFn: () => getGameHistory({ mode: '', selectedTable: null, page, pageSize }),
  })

  return (
    <Stack spacing={{ xs: 2, sm: 3 }}>
      <Box className="flex items-center justify-between gap-3">
        <Typography variant="h4" component="h1">
          Scores
        </Typography>
        <Button component={Link} to="/eleve" variant="contained" size="small">
          Jouer
        </Button>
      </Box>

      {historyQuery.isPending ? (
        <SectionLoader label="Chargement de ton historique…" />
      ) : historyQuery.isError || !historyQuery.data ? (
        <QueryError
          message="Ton historique n’a pas pu être chargé."
          onRetry={() => void historyQuery.refetch()}
        />
      ) : historyQuery.data.items.length === 0 ? (
        <EmptyState
          title="Aucune partie trouvée"
          description="Joue une première partie ou choisis un autre filtre."
        />
      ) : (
        <>
          <Box className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {historyQuery.data.items.map((session) => (
              <Paper key={session.id} variant="outlined" className="p-3 text-center sm:p-4">
                <Typography variant="h6" component="p" color="primary.main" sx={{ fontWeight: 900 }}>
                  {session.score} pts
                </Typography>
              </Paper>
            ))}
          </Box>
          {historyQuery.data.total > pageSize && (
            <Pagination
              count={Math.ceil(historyQuery.data.total / pageSize)}
              page={page + 1}
              onChange={(_, nextPage) => setPage(nextPage - 1)}
              color="primary"
              className="self-center"
            />
          )}
        </>
      )}
    </Stack>
  )
}
