import { Alert, Box, Button, Stack, Typography } from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { QueryError, SectionLoader } from '../components/admin/QueryState'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { getActiveGameSettings } from '../services/gameService'

export function SingleTableSelectionPage() {
  useDocumentTitle('Choisir une table')
  const settingsQuery = useQuery({
    queryKey: ['game-settings', 'active'],
    queryFn: getActiveGameSettings,
  })

  if (settingsQuery.isPending) {
    return <SectionLoader label="Préparation des tables…" />
  }
  if (settingsQuery.isError || !settingsQuery.data) {
    return (
      <QueryError
        message="Les tables actives n’ont pas pu être chargées."
        onRetry={() => void settingsQuery.refetch()}
      />
    )
  }

  const settings = settingsQuery.data

  return (
    <Stack spacing={{ xs: 2, sm: 3 }}>
      <Typography variant="h4" component="h1">
        Choisis une table
      </Typography>

      {settings.enabledTables.length === 0 ? (
        <Alert severity="info">Aucune table n’est active pour le moment.</Alert>
      ) : (
        <Box className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {settings.enabledTables.map((table) => (
            <Button
              key={table}
              component={Link}
              to={`/eleve/jeu/une-table/${table}`}
              variant="contained"
              className="aspect-square"
              aria-label={`Jouer avec la table de ${table}`}
              sx={{ fontSize: { xs: '1.25rem', sm: '1.75rem' } }}
            >
              × {table}
            </Button>
          ))}
        </Box>
      )}
    </Stack>
  )
}
