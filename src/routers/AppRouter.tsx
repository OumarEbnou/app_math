import { lazy, Suspense } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { FullPageLoader } from '../components/FullPageLoader'
import { useAuth } from '../hooks/useAuth'
import { AccessDeniedPage } from '../pages/AccessDeniedPage'
import { LoginPage } from '../pages/LoginPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { getHomePath } from '../utils/accessControl'
import { ProtectedRoute } from './ProtectedRoute'

const AdminDashboardPage = lazy(() =>
  import('../pages/AdminDashboardPage').then((module) => ({ default: module.AdminDashboardPage })),
)
const AdminResultsPage = lazy(() =>
  import('../pages/AdminResultsPage').then((module) => ({ default: module.AdminResultsPage })),
)
const AdminSettingsPage = lazy(() =>
  import('../pages/AdminSettingsPage').then((module) => ({ default: module.AdminSettingsPage })),
)
const AdminStudentDetailsPage = lazy(() =>
  import('../pages/AdminStudentDetailsPage').then((module) => ({ default: module.AdminStudentDetailsPage })),
)
const AdminStudentsPage = lazy(() =>
  import('../pages/AdminStudentsPage').then((module) => ({ default: module.AdminStudentsPage })),
)
const StudentHomePage = lazy(() =>
  import('../pages/StudentHomePage').then((module) => ({ default: module.StudentHomePage })),
)
const SingleTableSelectionPage = lazy(() =>
  import('../pages/SingleTableSelectionPage').then((module) => ({
    default: module.SingleTableSelectionPage,
  })),
)
const SingleTableGamePage = lazy(() =>
  import('../pages/SingleTableGamePage').then((module) => ({
    default: module.SingleTableGamePage,
  })),
)
const AllTablesGamePage = lazy(() =>
  import('../pages/SingleTableGamePage').then((module) => ({
    default: module.AllTablesGamePage,
  })),
)
const SingleTableHistoryPage = lazy(() =>
  import('../pages/SingleTableHistoryPage').then((module) => ({
    default: module.SingleTableHistoryPage,
  })),
)
const LeaderboardPage = lazy(() =>
  import('../pages/LeaderboardPage').then((module) => ({ default: module.LeaderboardPage })),
)
const AdminLeaderboardPage = lazy(() =>
  import('../pages/LeaderboardPage').then((module) => ({ default: module.AdminLeaderboardPage })),
)

function EntryRoute() {
  const { status, profile } = useAuth()

  if (status === 'loading') {
    return <FullPageLoader />
  }

  return <Navigate to={profile ? getHomePath(profile.role) : '/connexion'} replace />
}

function LoginRoute() {
  const { status, profile } = useAuth()

  if (status === 'loading') {
    return <FullPageLoader />
  }

  return profile ? <Navigate to={getHomePath(profile.role)} replace /> : <LoginPage />
}

export function AppRouter() {
  return (
    <Suspense fallback={<FullPageLoader label="Ouverture de la page…" />}>
      <Routes>
        <Route path="/" element={<EntryRoute />} />
        <Route path="/connexion" element={<LoginRoute />} />
        <Route
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AppShell>
                <Outlet />
              </AppShell>
            </ProtectedRoute>
          }
        >
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/eleves" element={<AdminStudentsPage />} />
          <Route path="/admin/eleves/:studentId" element={<AdminStudentDetailsPage />} />
          <Route path="/admin/resultats" element={<AdminResultsPage />} />
          <Route path="/admin/classements" element={<AdminLeaderboardPage />} />
          <Route path="/admin/parametres" element={<AdminSettingsPage />} />
        </Route>
        <Route
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <AppShell>
                <Outlet />
              </AppShell>
            </ProtectedRoute>
          }
        >
          <Route path="/eleve" element={<StudentHomePage />} />
          <Route path="/eleve/jeu/une-table" element={<SingleTableSelectionPage />} />
          <Route path="/eleve/jeu/une-table/:table" element={<SingleTableGamePage />} />
          <Route path="/eleve/jeu/toutes-les-tables" element={<AllTablesGamePage />} />
          <Route path="/eleve/historique" element={<SingleTableHistoryPage />} />
          <Route path="/eleve/classements" element={<LeaderboardPage />} />
        </Route>
        <Route path="/interdit" element={<AccessDeniedPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
