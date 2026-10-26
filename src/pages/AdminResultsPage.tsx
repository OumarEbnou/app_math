import { useDeferredValue, useState } from 'react'
import {
  Alert,
  Autocomplete,
  Box,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TablePagination,
  TextField,
  Tooltip,
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AdminPageHeader } from '../components/admin/AdminPageHeader'
import { AppIcon } from '../components/AppIcon'
import { DeleteScoreDialog } from '../components/admin/DeleteScoreDialog'
import { EmptyState, QueryError, SectionLoader } from '../components/admin/QueryState'
import { SessionsTable } from '../components/admin/SessionsTable'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import type { AdminStudent, GameSessionSummary, ResultFilters } from '../models/Admin'
import { deleteGameSession, listResults, listStudents } from '../services/adminService'
import { getErrorMessage } from '../utils/errors'

const initialFilters: ResultFilters = {
  studentId: '',
  mode: '',
  selectedTable: null,
  dateFrom: '',
  dateTo: '',
  page: 0,
  pageSize: 10,
}

export function AdminResultsPage() {
  useDocumentTitle('Résultats')
  const queryClient = useQueryClient()
  const [filters, setFilters] = useState(initialFilters)
  const [studentSearch, setStudentSearch] = useState('')
  const deferredStudentSearch = useDeferredValue(studentSearch)
  const [selectedStudent, setSelectedStudent] = useState<AdminStudent | null>(null)
  const [sessionToDelete, setSessionToDelete] = useState<GameSessionSummary | null>(null)
  const [feedback, setFeedback] = useState<{ severity: 'success' | 'error'; message: string } | null>(null)
  const dateError = Boolean(filters.dateFrom && filters.dateTo && filters.dateFrom > filters.dateTo)

  const studentsQuery = useQuery({
    queryKey: ['admin', 'student-options', deferredStudentSearch],
    queryFn: () =>
      listStudents({
        search: deferredStudentSearch,
        sortBy: 'display_name',
        sortDirection: 'asc',
        page: 0,
        pageSize: 25,
      }),
  })

  const resultsQuery = useQuery({
    queryKey: ['admin', 'results', filters],
    queryFn: () => listResults(filters),
    enabled: !dateError,
  })

  const deleteMutation = useMutation({
    mutationFn: ({ sessionId, reason }: { sessionId: string; reason: string }) =>
      deleteGameSession(sessionId, reason),
  })

  const handleDelete = async (reason: string) => {
    if (!sessionToDelete) return
    try {
      await deleteMutation.mutateAsync({ sessionId: sessionToDelete.id, reason })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'results'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'students'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'student-history'] }),
      ])
      setSessionToDelete(null)
      setFeedback({ severity: 'success', message: 'Le score et ses réponses ont été supprimés et journalisés.' })
    } catch (error) {
      setFeedback({ severity: 'error', message: getErrorMessage(error) })
    }
  }

  const clearFilters = () => {
    setFilters(initialFilters)
    setSelectedStudent(null)
    setStudentSearch('')
  }

  return (
    <Stack spacing={4}>
      <AdminPageHeader
        title="Résultats"
        description="Consultez les parties par élève, mode, table ou période et retirez les scores erronés."
      />

      {feedback && (
        <Alert severity={feedback.severity} onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      <Paper variant="outlined" className="p-4">
        <Box className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <Autocomplete
            options={studentsQuery.data?.items ?? []}
            value={selectedStudent}
            inputValue={studentSearch}
            onInputChange={(_, value) => setStudentSearch(value)}
            onChange={(_, student) => {
              setSelectedStudent(student)
              setFilters((current) => ({ ...current, studentId: student?.id ?? '', page: 0 }))
            }}
            getOptionLabel={(student) => `${student.displayName} — ${student.username}`}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            loading={studentsQuery.isPending}
            renderInput={(params) => <TextField {...params} label="Élève" size="small" />}
          />
          <FormControl size="small">
            <InputLabel id="result-mode-label">Mode</InputLabel>
            <Select
              labelId="result-mode-label"
              label="Mode"
              value={filters.mode}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  mode: event.target.value as ResultFilters['mode'],
                  selectedTable: event.target.value === 'single_table' ? current.selectedTable : null,
                  page: 0,
                }))
              }
            >
              <MenuItem value="">Tous les modes</MenuItem>
              <MenuItem value="single_table">Une table</MenuItem>
              <MenuItem value="all_tables">Toutes les tables</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" disabled={filters.mode !== 'single_table'}>
            <InputLabel id="result-table-label">Table</InputLabel>
            <Select
              labelId="result-table-label"
              label="Table"
              value={filters.selectedTable ?? ''}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  selectedTable: Number(event.target.value) || null,
                  page: 0,
                }))
              }
            >
              <MenuItem value="">Toutes</MenuItem>
              {Array.from({ length: 20 }, (_, index) => index + 1).map((table) => (
                <MenuItem key={table} value={table}>
                  Table de {table}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Du"
            type="date"
            size="small"
            value={filters.dateFrom}
            onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value, page: 0 }))}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="Au"
            type="date"
            size="small"
            value={filters.dateTo}
            onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value, page: 0 }))}
            slotProps={{ inputLabel: { shrink: true } }}
            error={dateError}
            helperText={dateError ? 'La date de fin doit suivre la date de début.' : undefined}
          />
        </Box>
        <Box className="mt-4 flex justify-end">
          <Tooltip title="Effacer les filtres">
            <IconButton onClick={clearFilters} aria-label="Effacer les filtres">
              <AppIcon name="trash" size={20} />
            </IconButton>
          </Tooltip>
        </Box>
      </Paper>

      {resultsQuery.isPending && !dateError && <SectionLoader label="Chargement des résultats…" />}
      {resultsQuery.isError && (
        <QueryError
          message="Les résultats n’ont pas pu être chargés."
          onRetry={() => void resultsQuery.refetch()}
        />
      )}
      {resultsQuery.data && resultsQuery.data.items.length === 0 && (
        <EmptyState
          title="Aucun résultat"
          description="Aucune partie ne correspond aux filtres sélectionnés."
        />
      )}
      {resultsQuery.data && resultsQuery.data.items.length > 0 && (
        <Paper variant="outlined" className="overflow-hidden">
          <SessionsTable sessions={resultsQuery.data.items} onDelete={setSessionToDelete} />
          <TablePagination
            component="div"
            count={resultsQuery.data.total}
            page={filters.page}
            rowsPerPage={filters.pageSize}
            rowsPerPageOptions={[10, 25, 50]}
            labelRowsPerPage="Résultats par page"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count}`}
            onPageChange={(_, page) => setFilters((current) => ({ ...current, page }))}
            onRowsPerPageChange={(event) =>
              setFilters((current) => ({
                ...current,
                pageSize: Number(event.target.value),
                page: 0,
              }))
            }
          />
        </Paper>
      )}

      {sessionToDelete && (
        <DeleteScoreDialog
          key={sessionToDelete.id}
          session={sessionToDelete}
          busy={deleteMutation.isPending}
          onClose={() => setSessionToDelete(null)}
          onConfirm={handleDelete}
        />
      )}
    </Stack>
  )
}
