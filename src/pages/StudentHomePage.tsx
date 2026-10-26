import { Box, Button, Stack, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import { FeatureCard } from '../components/FeatureCard'
import { AppIcon } from '../components/AppIcon'
import { useAuth } from '../hooks/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export function StudentHomePage() {
  useDocumentTitle('Espace élève')
  const { profile } = useAuth()

  return (
    <Stack spacing={{ xs: 2.5, sm: 4 }}>
      <Box>
        <Typography variant="h4" component="h1">
          Bonjour {profile?.display_name} !
        </Typography>
      </Box>
      <Box className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        <FeatureCard
          emoji="🎯"
          title="1 table"
          accent="purple"
          action={
            <Button component={Link} to="/eleve/jeu/une-table" variant="contained" fullWidth>
              <AppIcon name="play" />
              <Box component="span" className="sr-only">Jouer à une table</Box>
            </Button>
          }
        />
        <FeatureCard
          emoji="🚀"
          title="Mix"
          accent="orange"
          action={
            <Button component={Link} to="/eleve/jeu/toutes-les-tables" variant="contained" color="secondary" fullWidth>
              <AppIcon name="play" />
              <Box component="span" className="sr-only">Jouer au mix</Box>
            </Button>
          }
        />
        <FeatureCard
          emoji="🏆"
          title="Scores"
          accent="green"
          action={
            <Button component={Link} to="/eleve/historique" variant="outlined" fullWidth>
              <AppIcon name="scores" />
              <Box component="span" className="sr-only">Voir mes scores</Box>
            </Button>
          }
        />
      </Box>
    </Stack>
  )
}
