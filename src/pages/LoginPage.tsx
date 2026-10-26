import { useState, type FormEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useLocation, useNavigate } from 'react-router-dom'
import { BrandMark } from '../components/BrandMark'
import { ConfigurationNotice } from '../components/ConfigurationNotice'
import { useAuth } from '../hooks/useAuth'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { getHomePath } from '../utils/accessControl'

export function LoginPage() {
  useDocumentTitle('Connexion')
  const { signIn, error, clearError, isConfigured } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    clearError()
    setIsSubmitting(true)

    try {
      const profile = await signIn({ username: username.trim(), password })
      const requestedPath = (location.state as { from?: string } | null)?.from
      const roleHome = getHomePath(profile.role)
      const destination = requestedPath?.startsWith(roleHome) ? requestedPath : roleHome
      navigate(destination, { replace: true })
    } catch {
      // Le contexte affiche un message volontairement générique et adapté à l’utilisateur.
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Box className="relative grid min-h-screen place-items-center overflow-hidden bg-[radial-gradient(circle_at_20%_15%,_#ffe49d,_transparent_28%),radial-gradient(circle_at_85%_80%,_#ded0ff,_transparent_32%),linear-gradient(145deg,_#fffaf3,_#f8f3ff)] px-4 py-10">
      <Box aria-hidden="true" className="absolute -left-10 top-1/2 text-8xl opacity-10">
        3 × 4
      </Box>
      <Box aria-hidden="true" className="absolute right-5 top-10 text-7xl opacity-10">
        8 × 7
      </Box>
      <Container maxWidth="sm">
        <Stack spacing={3} sx={{ alignItems: 'center' }}>
          <BrandMark />
          <Paper className="w-full border border-white/80 p-6 shadow-[0_24px_70px_rgba(76,47,126,0.16)] sm:p-10">
            <Stack spacing={3}>
              <Box>
                <Typography variant="h4" component="h1" align="center" gutterBottom>
                  Prêt à progresser ?
                </Typography>
                <Typography color="text.secondary" align="center">
                  Connecte-toi pour retrouver ton espace.
                </Typography>
              </Box>

              <ConfigurationNotice />

              {error && isConfigured && (
                <Alert severity="error" onClose={clearError}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={(event) => void handleSubmit(event)} noValidate>
                <Stack spacing={2.5}>
                  <TextField
                    id="username"
                    label="Nom d’utilisateur"
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    autoComplete="username"
                    required
                    fullWidth
                    disabled={!isConfigured || isSubmitting}
                    slotProps={{ htmlInput: { autoCapitalize: 'none', spellCheck: false } }}
                  />
                  <TextField
                    id="password"
                    label="Mot de passe"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    required
                    fullWidth
                    disabled={!isConfigured || isSubmitting}
                  />
                  <Button
                    type="submit"
                    size="large"
                    variant="contained"
                    disabled={!isConfigured || isSubmitting || !username.trim() || !password}
                  >
                    {isSubmitting ? (
                      <CircularProgress size={24} color="inherit" aria-label="Connexion en cours" />
                    ) : (
                      'Se connecter'
                    )}
                  </Button>
                </Stack>
              </Box>
            </Stack>
          </Paper>
          <Typography variant="body2" color="text.secondary" align="center">
            Les comptes sont créés par l’administrateur de l’établissement.
          </Typography>
        </Stack>
      </Container>
    </Box>
  )
}
