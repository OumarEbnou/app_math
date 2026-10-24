import { Box, Button, Divider, Paper, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { AdminPageHeader } from '../components/admin/AdminPageHeader'
import { EmptyState, QueryError, SectionLoader } from '../components/admin/QueryState'
import { SessionsTable } from '../components/admin/SessionsTable'
import { StatCard } from '../components/admin/StatCard'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import type { GameSessionSummary } from '../models/Admin'
import { getAdminDashboard } from '../services/adminService'
import { formatGameMode } from '../utils/formatters'

function ScoreList({ title, sessions }: { title: string; sessions: GameSessionSummary[] }) {
  return (
    <Paper variant="outlined" className="p-5">
      <Typography variant="h6" component="h2" gutterBottom>
        {title}
      </Typography>
      {sessions.length === 0 ? (
        <Typography color="text.secondary">Aucun score enregistré.</Typography>
      ) : (
        <Stack divider={<Divider flexItem />}>
          {sessions.map((session, index) => (
            <Box key={session.id} className="flex items-center justify-between gap-4 py-3">
              <Box className="flex min-w-0 items-center gap-3">
                <Box
                  aria-label={`Position ${index + 1}`}
                  className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-100 font-black text-amber-900"
                >
                  {index + 1}
                </Box>
                <Box className="min-w-0">
                  <Typography noWrap sx={{ fontWeight: 800 }}>
                    {session.studentName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {formatGameMode(session.mode, session.selectedTable)}
                  </Typography>
                </Box>
              </Box>
              <Typography sx={{ fontWeight: 900 }}>{session.score} pts</Typography>
            </Box>
          ))}
        </Stack>
      )}
    </Paper>
  )
}

export function AdminDashboardPage() {
  useDocumentTitle('Tableau de bord')
  const dashboardQuery = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: getAdminDashboard,
  })

  return (
    <Stack spacing={4}>
      <AdminPageHeader
        title="Tableau de bord"
        description="Suivez l’activité des élèves et accédez rapidement aux outils de gestion."
      />

      {dashboardQuery.isPending && <SectionLoader />}
      {dashboardQuery.isError && (
        <QueryError
          message="Le tableau de bord n’a pas pu être chargé."
          onRetry={() => void dashboardQuery.refetch()}
        />
      )}

      {dashboardQuery.data && (
        <>
          <Box className="grid gap-4 sm:grid-cols-2">
            <StatCard
              label="Élèves actifs"
              value={dashboardQuery.data.activeStudents}
              emoji="👩‍🎓"
              helper="Comptes actuellement autorisés"
            />
            <StatCard
              label="Parties jouées"
              value={dashboardQuery.data.totalSessions}
              emoji="🎯"
              helper="Tous modes confondus"
            />
          </Box>

          <Box className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                title: 'Gérer les élèves',
                description: 'Créer, modifier ou désactiver un compte.',
                path: '/admin/eleves',
              },
              {
                title: 'Consulter les résultats',
                description: 'Filtrer les parties et contrôler les scores.',
                path: '/admin/resultats',
              },
              {
                title: 'Régler les jeux',
                description: 'Adapter les durées, tables et multiplicateurs.',
                path: '/admin/parametres',
              },
              {
                title: 'Voir les classements',
                description: 'Contrôler les meilleurs scores de chaque mode.',
                path: '/admin/classements',
              },
            ].map((item) => (
              <Paper key={item.path} variant="outlined" className="flex h-full flex-col p-5">
                <Typography variant="h6" component="h2" gutterBottom>
                  {item.title}
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 3, flexGrow: 1 }}>
                  {item.description}
                </Typography>
                <Button component={Link} to={item.path} variant="outlined">
                  Ouvrir
                </Button>
              </Paper>
            ))}
          </Box>

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              Parties récentes
            </Typography>
            {dashboardQuery.data.recentSessions.length > 0 ? (
              <SessionsTable sessions={dashboardQuery.data.recentSessions} />
            ) : (
              <EmptyState
                title="Aucune partie pour le moment"
                description="Les nouvelles parties apparaîtront ici dès que les jeux seront disponibles."
              />
            )}
          </Box>

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              Meilleurs scores
            </Typography>
            <Box className="grid gap-4 lg:grid-cols-2">
              <ScoreList title="Mode Une table" sessions={dashboardQuery.data.singleTableTop} />
              <ScoreList title="Mode Toutes les tables" sessions={dashboardQuery.data.allTablesTop} />
            </Box>
          </Box>
        </>
      )}
    </Stack>
  )
}
