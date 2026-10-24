import { Button, Container, Paper, Stack, Typography } from '@mui/material'
import { Link } from 'react-router-dom'
import { BrandMark } from '../components/BrandMark'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export function NotFoundPage() {
  useDocumentTitle('Page introuvable')

  return (
    <Container maxWidth="sm" className="grid min-h-screen place-items-center py-10">
      <Paper className="w-full p-8 text-center shadow-lg">
        <Stack spacing={3} sx={{ alignItems: 'center' }}>
          <BrandMark />
          <Typography variant="h2" component="p" color="primary">
            404
          </Typography>
          <Typography variant="h4" component="h1">
            Page introuvable
          </Typography>
          <Typography color="text.secondary">
            Cette page n’existe pas ou a été déplacée.
          </Typography>
          <Button component={Link} to="/" variant="contained">
            Revenir à l’accueil
          </Button>
        </Stack>
      </Paper>
    </Container>
  )
}
