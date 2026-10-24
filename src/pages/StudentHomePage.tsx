import { Box, Button, Chip, Stack, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import { FeatureCard } from '../components/FeatureCard'
import { useAuth } from '../hooks/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export function StudentHomePage() {
  useDocumentTitle('Espace élève')
  const { profile } = useAuth()

  return (
    <Stack spacing={4}>
      <Box>
        <Chip label="Espace élève" color="primary" className="mb-4" />
        <Typography variant="h3" component="h1" gutterBottom>
          Bienvenue {profile?.display_name} !
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
          Choisis ton défi, bats ton record et suis tes progrès.
        </Typography>
      </Box>
      <Box className="grid gap-5 md:grid-cols-3">
        <FeatureCard
          emoji="🎯"
          title="Une table"
          description="Choisis une table et entraîne-toi à ton rythme."
          accent="purple"
          action={
            <Button component={Link} to="/eleve/jeu/une-table" variant="contained" fullWidth>
              Choisir une table
            </Button>
          }
        />
        <FeatureCard
          emoji="🚀"
          title="Toutes les tables"
          description="Relève le défi avec toutes les tables actives mélangées."
          accent="orange"
          action={
            <Button component={Link} to="/eleve/jeu/toutes-les-tables" variant="contained" color="secondary" fullWidth>
              Jouer à toutes les tables
            </Button>
          }
        />
        <FeatureCard
          emoji="🏆"
          title="Tes progrès"
          description="Retrouve tous tes scores et consulte les classements."
          accent="green"
          action={
            <Button component={Link} to="/eleve/historique" variant="outlined" fullWidth>
              Voir mon historique
            </Button>
          }
        />
      </Box>
    </Stack>
  )
}
