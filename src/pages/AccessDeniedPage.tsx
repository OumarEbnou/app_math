import { Button, Container, Paper, Stack, Typography } from '@mui/material'
import { Link, useLocation } from 'react-router-dom'
import { BrandMark } from '../components/BrandMark'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export function AccessDeniedPage() {
  useDocumentTitle('Accès refusé')
  const location = useLocation()
  const home = (location.state as { home?: string } | null)?.home ?? '/'

  return (
    <Container maxWidth="sm" className="grid min-h-screen place-items-center py-10">
      <Paper className="w-full p-8 text-center shadow-lg">
        <Stack spacing={3} sx={{ alignItems: 'center' }}>
          <BrandMark />
          <Typography variant="h3" component="h1">
            Accès refusé
          </Typography>
          <Typography color="text.secondary">
            Ton compte n’a pas l’autorisation d’ouvrir cette page.
          </Typography>
          <Button component={Link} to={home} variant="contained">
            Retour à mon espace
          </Button>
        </Stack>
      </Paper>
    </Container>
  )
}
