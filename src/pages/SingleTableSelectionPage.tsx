import { Alert, Box, Button, Chip, Paper, Stack, Typography } from '@mui/material'
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
    <Stack spacing={4}>
      <Box>
        <Chip label="Jeu · Une table" color="primary" className="mb-4" />
        <Typography variant="h3" component="h1" gutterBottom>
          Choisis ta table
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
          Tu auras {settings.gameDurationSeconds} secondes pour marquer le plus de points.
        </Typography>
      </Box>

      {settings.enabledTables.length === 0 ? (
        <Alert severity="info">Aucune table n’est active pour le moment.</Alert>
      ) : (
        <Box className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {settings.enabledTables.map((table) => (
            <Button
              key={table}
              component={Link}
              to={`/eleve/jeu/une-table/${table}`}
              variant="contained"
              className="aspect-square"
              aria-label={`Jouer avec la table de ${table}`}
              sx={{ fontSize: { xs: '1.5rem', sm: '2rem' }, flexDirection: 'column', gap: 0.5 }}
            >
              <span>× {table}</span>
              <Typography component="span" variant="caption" color="inherit">
                Table de {table}
              </Typography>
            </Button>
          ))}
        </Box>
      )}

      <Paper variant="outlined" className="p-5">
        <Typography variant="h6" component="h2" gutterBottom>
          Comment gagner plus de points ?
        </Typography>
        <Typography color="text.secondary">
          Réponds juste en moins de {settings.fastAnswerLimitMs / 1000} s. Après{' '}
          {settings.fastAnswersForMultiplier} réponses rapides de suite, la question suivante
          passe à ×2, puis ×3, jusqu’à ×{settings.maxMultiplier}.
        </Typography>
      </Paper>
    </Stack>
  )
}
