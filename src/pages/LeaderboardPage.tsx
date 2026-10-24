import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminPageHeader } from '../components/admin/AdminPageHeader'
import { EmptyState, QueryError, SectionLoader } from '../components/admin/QueryState'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import type { PlayableGameMode } from '../models/Game'
import { getActiveGameSettings, getLeaderboard } from '../services/gameService'
import { formatDateTime } from '../utils/formatters'

interface LeaderboardPageProps {
  adminView?: boolean
}

export function LeaderboardPage({ adminView = false }: LeaderboardPageProps = {}) {
  useDocumentTitle(adminView ? 'Classements administrateur' : 'Classements')
  const [mode, setMode] = useState<PlayableGameMode>('single_table')
  const [selectedTable, setSelectedTable] = useState<number | null>(null)
  const settingsQuery = useQuery({
    queryKey: ['game-settings', 'active'],
    queryFn: getActiveGameSettings,
  })
  const effectiveTable = selectedTable ?? settingsQuery.data?.enabledTables[0] ?? null
  const leaderboardQuery = useQuery({
    queryKey: ['leaderboard', mode, mode === 'single_table' ? effectiveTable : null],
    queryFn: () => getLeaderboard(mode, mode === 'single_table' ? effectiveTable : null),
    enabled: mode === 'all_tables' || effectiveTable !== null,
  })

  const title = mode === 'all_tables' ? 'Toutes les tables' : `Table de ${effectiveTable ?? '—'}`

  return (
    <Stack spacing={4}>
      {adminView ? (
        <AdminPageHeader
          title="Classements"
          description="Consultez le classement public de chaque table et du mode Toutes les tables."
        />
      ) : (
        <Box>
          <Typography variant="h4" component="h1">
            Top
          </Typography>
        </Box>
      )}

      <Box className="flex flex-col gap-3 sm:flex-row">
        <FormControl sx={{ minWidth: 230 }}>
          <InputLabel id="leaderboard-mode-label">Mode</InputLabel>
          <Select
            labelId="leaderboard-mode-label"
            label="Mode"
            value={mode}
            onChange={(event) => {
              setMode(event.target.value === 'all_tables' ? 'all_tables' : 'single_table')
            }}
          >
            <MenuItem value="single_table">1 table</MenuItem>
            <MenuItem value="all_tables">Mix</MenuItem>
          </Select>
        </FormControl>
        {mode === 'single_table' && (
          <FormControl sx={{ minWidth: 230 }}>
            <InputLabel id="leaderboard-table-label">Table</InputLabel>
            <Select
              labelId="leaderboard-table-label"
              label="Table"
              value={effectiveTable ?? ''}
              onChange={(event) => setSelectedTable(Number(event.target.value))}
            >
              {(settingsQuery.data?.enabledTables ?? []).map((table) => (
                <MenuItem key={table} value={table}>
                  Table de {table}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      <Box className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Typography variant="h4" component="h2">
          {title}
        </Typography>
        {!adminView && (
          <Button
            component={Link}
            to={mode === 'all_tables' ? '/eleve/jeu/toutes-les-tables' : '/eleve/jeu/une-table'}
            variant="contained"
          >
            Jouer
          </Button>
        )}
      </Box>

      {settingsQuery.isPending || leaderboardQuery.isPending ? (
        <SectionLoader label="Chargement du classement…" />
      ) : settingsQuery.isError || leaderboardQuery.isError ? (
        <QueryError
          message="Ce classement n’a pas pu être chargé."
          onRetry={() => {
            void settingsQuery.refetch()
            void leaderboardQuery.refetch()
          }}
        />
      ) : (leaderboardQuery.data ?? []).length === 0 ? (
        <EmptyState
          title="Pas encore de score"
          description="Le premier score vérifié apparaîtra ici."
        />
      ) : (
        <Stack spacing={2} component="ol" sx={{ p: 0, m: 0, listStyle: 'none' }}>
          {leaderboardQuery.data?.map((entry) => (
            <Paper key={`${entry.position}-${entry.displayName}`} component="li" variant="outlined" className="p-3 sm:p-4">
              <Box className="flex items-center gap-3">
                <Box
                  aria-label={`Position ${entry.position}`}
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-purple-100 font-black text-purple-800 sm:size-12 sm:text-xl"
                >
                  {entry.position}
                </Box>
                <Box className="min-w-0 flex-1">
                  <Typography variant="h6" component="p" noWrap>
                    {entry.displayName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDateTime(entry.endedAt)}
                  </Typography>
                </Box>
                <Typography variant="h6" color="primary.main" sx={{ fontWeight: 900 }}>
                  {entry.score} pts
                </Typography>
              </Box>
            </Paper>
          ))}
        </Stack>
      )}
    </Stack>
  )
}

export function AdminLeaderboardPage() {
  return <LeaderboardPage adminView />
}
