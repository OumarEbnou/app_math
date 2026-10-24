import { useEffect, useRef, useState, type PropsWithChildren } from 'react'
import {
  AppBar,
  Box,
  Button,
  Container,
  Snackbar,
  Toolbar,
  Typography,
} from '@mui/material'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { BrandMark } from './BrandMark'

export function AppShell({ children }: PropsWithChildren) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const [signOutError, setSignOutError] = useState<string | null>(null)

  useEffect(() => {
    mainRef.current?.focus()
  }, [location.pathname])

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/connexion', { replace: true })
    } catch (error) {
      setSignOutError(error instanceof Error ? error.message : 'La déconnexion a échoué.')
    }
  }

  return (
    <Box className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#fff0ca,_transparent_35%),linear-gradient(135deg,_#fffaf3,_#f5f0ff)]">
      <a className="skip-link" href="#main-content">
        Aller au contenu principal
      </a>
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar className="border-b border-purple-100 bg-white/90 backdrop-blur">
          <Container maxWidth="lg" className="flex min-h-16 items-center justify-between gap-3 px-0">
            <Link to={profile?.role === 'admin' ? '/admin' : '/eleve'} className="no-underline">
              <BrandMark />
            </Link>
            <Box className="flex items-center gap-2 sm:gap-3">
              <Typography className="hidden sm:block" sx={{ fontWeight: 800 }}>
                Bonjour, {profile?.display_name}
              </Typography>
              <Button variant="outlined" onClick={() => void handleSignOut()}>
                Se déconnecter
              </Button>
            </Box>
          </Container>
        </Toolbar>
        {profile?.role === 'admin' && (
          <Box className="border-b border-purple-100 bg-white">
            <Container
              maxWidth="lg"
              component="nav"
              aria-label="Navigation de l’administration"
              className="flex gap-1 overflow-x-auto py-2"
            >
              {[
                { label: 'Tableau de bord', path: '/admin' },
                { label: 'Élèves', path: '/admin/eleves' },
                { label: 'Résultats', path: '/admin/resultats' },
                { label: 'Classements', path: '/admin/classements' },
                { label: 'Paramètres', path: '/admin/parametres' },
              ].map((item) => {
                const isActive =
                  item.path === '/admin'
                    ? location.pathname === item.path
                    : location.pathname.startsWith(item.path)

                return (
                  <Button
                    key={item.path}
                    component={Link}
                    to={item.path}
                    size="small"
                    variant={isActive ? 'contained' : 'text'}
                    aria-current={isActive ? 'page' : undefined}
                    sx={{ minWidth: 'max-content' }}
                  >
                    {item.label}
                  </Button>
                )
              })}
            </Container>
          </Box>
        )}
        {profile?.role === 'student' && (
          <Box className="border-b border-purple-100 bg-white">
            <Container
              maxWidth="lg"
              component="nav"
              aria-label="Navigation de l’espace élève"
              className="flex gap-1 overflow-x-auto py-2"
            >
              {[
                { label: 'Accueil', path: '/eleve', exact: true },
                { label: 'Jouer · Une table', path: '/eleve/jeu/une-table', exact: false },
                { label: 'Toutes les tables', path: '/eleve/jeu/toutes-les-tables', exact: false },
                { label: 'Mon historique', path: '/eleve/historique', exact: false },
                { label: 'Classements', path: '/eleve/classements', exact: false },
              ].map((item) => {
                const isActive = item.exact
                  ? location.pathname === item.path
                  : location.pathname.startsWith(item.path)

                return (
                  <Button
                    key={item.path}
                    component={Link}
                    to={item.path}
                    size="small"
                    variant={isActive ? 'contained' : 'text'}
                    aria-current={isActive ? 'page' : undefined}
                    sx={{ minWidth: 'max-content' }}
                  >
                    {item.label}
                  </Button>
                )
              })}
            </Container>
          </Box>
        )}
      </AppBar>
      <Container
        id="main-content"
        ref={mainRef}
        tabIndex={-1}
        component="main"
        maxWidth="lg"
        className="py-8 sm:py-12"
      >
        {children}
      </Container>
      <Snackbar
        open={Boolean(signOutError)}
        autoHideDuration={5000}
        onClose={() => setSignOutError(null)}
        message={signOutError}
      />
    </Box>
  )
}
