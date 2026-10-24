import { Alert, Box, Button, Chip, Paper, Stack, TablePagination, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AdminPageHeader } from '../components/admin/AdminPageHeader'
import { EmptyState, QueryError, SectionLoader } from '../components/admin/QueryState'
import { SessionsTable } from '../components/admin/SessionsTable'
import { StatCard } from '../components/admin/StatCard'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { getStudent, getStudentHistory } from '../services/adminService'
import { formatDateTime } from '../utils/formatters'

export function AdminStudentDetailsPage() {
  useDocumentTitle('Historique élève')
  const { studentId = '' } = useParams()
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const studentQuery = useQuery({
    queryKey: ['admin', 'student', studentId],
    queryFn: () => getStudent(studentId),
    enabled: Boolean(studentId),
  })
  const historyQuery = useQuery({
    queryKey: ['admin', 'student-history', studentId, page, pageSize],
    queryFn: () => getStudentHistory(studentId, page, pageSize),
    enabled: Boolean(studentId),
  })

  if (!studentId) {
    return <Alert severity="error">Identifiant élève manquant.</Alert>
  }

  if (studentQuery.isPending || historyQuery.isPending) {
    return <SectionLoader label="Chargement de l’historique…" />
  }

  if (studentQuery.isError || historyQuery.isError || !studentQuery.data) {
    return (
      <QueryError
        message="L’historique de cet élève n’a pas pu être chargé."
        onRetry={() => {
          void studentQuery.refetch()
          void historyQuery.refetch()
        }}
      />
    )
  }

  const student = studentQuery.data
  const history = historyQuery.data?.items ?? []

  return (
    <Stack spacing={4}>
      <AdminPageHeader
        eyebrow="Élèves / Historique"
        title={student.displayName}
        description="Consultez les statistiques et les dernières parties de cet élève."
        action={
          <Button component={Link} to="/admin/eleves" variant="outlined">
            Retour aux élèves
          </Button>
        }
      />

      <Paper variant="outlined" className="p-5">
        <Box className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Box>
            <Typography color="text.secondary" variant="body2">
              Identifiant de connexion
            </Typography>
            <Typography sx={{ fontWeight: 800 }}>{student.email}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Compte créé le {formatDateTime(student.createdAt)}
            </Typography>
          </Box>
          <Chip
            color={student.isActive ? 'success' : 'default'}
            label={student.isActive ? 'Compte actif' : 'Compte désactivé'}
          />
        </Box>
      </Paper>

      <Box className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label="Parties jouées"
          value={student.totalSessions}
          emoji="🎯"
          helper="Toutes les parties"
        />
        <StatCard
          label="Meilleur score"
          value={student.bestScore}
          emoji="🏆"
          helper="Tous modes confondus"
        />
      </Box>

      <Box>
        <Typography variant="h5" component="h2" gutterBottom>
          Historique des parties
        </Typography>
        {history.length > 0 ? (
          <Paper variant="outlined" className="overflow-hidden">
            <SessionsTable sessions={history} />
            <TablePagination
              component="div"
              count={historyQuery.data?.total ?? 0}
              page={page}
              rowsPerPage={pageSize}
              rowsPerPageOptions={[10, 25, 50]}
              labelRowsPerPage="Parties par page"
              labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count}`}
              onPageChange={(_, nextPage) => setPage(nextPage)}
              onRowsPerPageChange={(event) => {
                setPageSize(Number(event.target.value))
                setPage(0)
              }}
            />
          </Paper>
        ) : (
          <EmptyState
            title="Aucune partie enregistrée"
            description="Les résultats de cet élève apparaîtront ici après ses premières parties."
          />
        )}
      </Box>
    </Stack>
  )
}
