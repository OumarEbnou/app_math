import { useEffect, useRef, useState, type PropsWithChildren } from 'react'
import {
  AppBar,
  Box,
  Button,
  Container,
  IconButton,
  Snackbar,
  Tooltip,
  Toolbar,
  Typography,
} from '@mui/material'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { BrandMark } from './BrandMark'
import { AppIcon, type AppIconName } from './AppIcon'

const adminNavigation: Array<{ label: string; path: string; icon: AppIconName }> = [
  { label: 'Tableau de bord', path: '/admin', icon: 'home' },
  { label: 'Élèves', path: '/admin/eleves', icon: 'students' },
  { label: 'Résultats', path: '/admin/resultats', icon: 'scores' },
  { label: 'Classements', path: '/admin/classements', icon: 'trophy' },
  { label: 'Paramètres', path: '/admin/parametres', icon: 'settings' },
]

const studentNavigation: Array<{
  label: string
  path: string
  exact: boolean
  icon: AppIconName
}> = [
  { label: 'Accueil', path: '/eleve', exact: true, icon: 'home' },
  { label: '1 table', path: '/eleve/jeu/une-table', exact: false, icon: 'table' },
  { label: 'Mix', path: '/eleve/jeu/toutes-les-tables', exact: false, icon: 'mix' },
  { label: 'Scores', path: '/eleve/historique', exact: false, icon: 'scores' },
  { label: 'Top', path: '/eleve/classements', exact: false, icon: 'trophy' },
]

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
        <Toolbar
          className="border-b border-purple-100 bg-white/90 backdrop-blur"
          sx={{ minHeight: { xs: 56, sm: 64 } }}
        >
          <Container maxWidth="lg" className="flex items-center justify-between gap-3 px-0">
            <Link to={profile?.role === 'admin' ? '/admin' : '/eleve'} className="no-underline">
              <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                <BrandMark compact />
              </Box>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                <BrandMark />
              </Box>
            </Link>
            <Box className="flex items-center gap-2 sm:gap-3">
              <Typography className="hidden sm:block" sx={{ fontWeight: 800 }}>
                Bonjour, {profile?.display_name}
              </Typography>
              <Tooltip title="Se déconnecter">
                <IconButton
                  color="primary"
                  onClick={() => void handleSignOut()}
                  aria-label="Se déconnecter"
                  sx={{ border: 1, borderColor: 'divider' }}
                >
                  <AppIcon name="power" />
                </IconButton>
              </Tooltip>
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
              {adminNavigation.map((item) => {
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
                    aria-label={item.label}
                    sx={{ minWidth: { xs: 44, sm: 'max-content' }, gap: { xs: 0, sm: 0.75 }, px: { xs: 1.25, sm: 1.5 } }}
                  >
                    <AppIcon name={item.icon} size={20} />
                    <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                      {item.label}
                    </Box>
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
              className="flex gap-1 overflow-x-auto py-1.5"
            >
              {studentNavigation.map((item) => {
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
                    aria-label={item.label}
                    sx={{ minWidth: { xs: 44, sm: 'max-content' }, gap: { xs: 0, sm: 0.75 }, px: { xs: 1.25, sm: 1.5 } }}
                  >
                    <AppIcon name={item.icon} size={20} />
                    <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                      {item.label}
                    </Box>
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
        className="py-4 sm:py-8"
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
