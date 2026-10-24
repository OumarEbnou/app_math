import {
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Stack,
  Typography,
} from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState, QueryError, SectionLoader } from '../components/admin/QueryState'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import type { PlayableGameMode } from '../models/Game'
import { getGameHistory } from '../services/gameService'
import { calculateAccuracy, formatDateTime, formatGameMode } from '../utils/formatters'

const pageSize = 10

export function SingleTableHistoryPage() {
  useDocumentTitle('Mon historique')
  const [mode, setMode] = useState<PlayableGameMode | ''>('')
  const [selectedTable, setSelectedTable] = useState<number | null>(null)
  const [page, setPage] = useState(0)
  const historyQuery = useQuery({
    queryKey: ['game-history', mode, selectedTable, page],
    queryFn: () => getGameHistory({ mode, selectedTable, page, pageSize }),
  })

  return (
    <Stack spacing={4}>
      <Box className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <Box>
          <Chip label="Mes progrès" color="primary" className="mb-4" />
          <Typography variant="h3" component="h1" gutterBottom>
            Mon historique
          </Typography>
          <Typography color="text.secondary">
            Toutes tes parties, de la plus récente à la plus ancienne.
          </Typography>
        </Box>
        <Button component={Link} to="/eleve" variant="contained">
          Jouer
        </Button>
      </Box>

      <Box className="flex flex-col gap-3 sm:flex-row">
        <FormControl sx={{ minWidth: 230 }}>
          <InputLabel id="history-mode-label">Mode</InputLabel>
          <Select
            labelId="history-mode-label"
            label="Mode"
            value={mode}
            onChange={(event) => {
              const value = event.target.value
              setMode(value === 'single_table' || value === 'all_tables' ? value : '')
              setSelectedTable(null)
              setPage(0)
            }}
          >
            <MenuItem value="">Tous les modes</MenuItem>
            <MenuItem value="single_table">Une table</MenuItem>
            <MenuItem value="all_tables">Toutes les tables</MenuItem>
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 230 }} disabled={mode !== 'single_table'}>
          <InputLabel id="history-table-label">Table</InputLabel>
          <Select
            labelId="history-table-label"
            label="Table"
            value={selectedTable ?? ''}
            onChange={(event) => {
              setSelectedTable(String(event.target.value) === '' ? null : Number(event.target.value))
              setPage(0)
            }}
          >
            <MenuItem value="">Toutes les tables</MenuItem>
            {Array.from({ length: 20 }, (_, index) => index + 1).map((table) => (
              <MenuItem key={table} value={table}>
                Table de {table}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
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
          <Box className="grid gap-4 md:grid-cols-2">
            {historyQuery.data.items.map((session) => {
              const isBest = session.score === historyQuery.data.bestScore
              return (
                <Paper key={session.id} variant="outlined" className="p-5">
                  <Box className="flex items-start justify-between gap-3">
                    <Box>
                      <Typography variant="h5" component="h2">
                        {session.score} points
                      </Typography>
                      <Typography color="text.secondary">
                        {formatGameMode(session.mode, session.selectedTable)} ·{' '}
                        {formatDateTime(session.endedAt)}
                      </Typography>
                    </Box>
                    {isBest && <Chip label="Meilleur score" color="success" size="small" />}
                  </Box>
                  <Box className="mt-4 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
                    {[
                      ['Questions', session.totalQuestions],
                      ['Bonnes', session.correctAnswers],
                      [
                        'Réussite',
                        `${calculateAccuracy(session.correctAnswers, session.totalQuestions)} %`,
                      ],
                      ['Meilleur ×', `×${session.maxMultiplierReached}`],
                    ].map(([label, value]) => (
                      <Box key={label}>
                        <Typography variant="caption" color="text.secondary">
                          {label}
                        </Typography>
                        <Typography sx={{ fontWeight: 900 }}>{value}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Paper>
              )
            })}
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
