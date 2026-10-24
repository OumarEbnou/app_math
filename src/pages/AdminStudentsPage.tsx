import { useState, type FormEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { AdminPageHeader } from '../components/admin/AdminPageHeader'
import { ConfirmDialog } from '../components/admin/ConfirmDialog'
import { EmptyState, QueryError, SectionLoader } from '../components/admin/QueryState'
import { PasswordResetDialog } from '../components/admin/PasswordResetDialog'
import { StudentFormDialog } from '../components/admin/StudentFormDialog'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import type {
  AdminStudent,
  CreateStudentInput,
  StudentListOptions,
  UpdateStudentInput,
} from '../models/Admin'
import {
  createStudent,
  listStudents,
  resetStudentPassword,
  setStudentActive,
  updateStudent,
} from '../services/adminService'
import { getErrorMessage } from '../utils/errors'
import { formatDateTime } from '../utils/formatters'

type Feedback = { severity: 'success' | 'error'; message: string }

const initialOptions: StudentListOptions = {
  search: '',
  sortBy: 'display_name',
  sortDirection: 'asc',
  page: 0,
  pageSize: 10,
}

export function AdminStudentsPage() {
  useDocumentTitle('Gestion des élèves')
  const queryClient = useQueryClient()
  const [options, setOptions] = useState(initialOptions)
  const [searchDraft, setSearchDraft] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<AdminStudent | null>(null)
  const [passwordStudent, setPasswordStudent] = useState<AdminStudent | null>(null)
  const [statusStudent, setStatusStudent] = useState<AdminStudent | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const studentsQuery = useQuery({
    queryKey: ['admin', 'students', options],
    queryFn: () => listStudents(options),
  })

  const invalidateAdminData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'student'] }),
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] }),
    ])
  }

  const createMutation = useMutation({ mutationFn: createStudent })
  const updateMutation = useMutation({ mutationFn: updateStudent })
  const statusMutation = useMutation({
    mutationFn: ({ studentId, isActive }: { studentId: string; isActive: boolean }) =>
      setStudentActive(studentId, isActive),
  })
  const passwordMutation = useMutation({
    mutationFn: ({ studentId, password }: { studentId: string; password: string }) =>
      resetStudentPassword(studentId, password),
  })

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setOptions((current) => ({ ...current, search: searchDraft.trim(), page: 0 }))
  }

  const handleCreate = async (input: CreateStudentInput) => {
    try {
      await createMutation.mutateAsync(input)
      await invalidateAdminData()
      setCreateOpen(false)
      setFeedback({ severity: 'success', message: `Le compte de ${input.displayName.trim()} a été créé.` })
    } catch (error) {
      setFeedback({ severity: 'error', message: getErrorMessage(error) })
    }
  }

  const handleUpdate = async (input: UpdateStudentInput) => {
    try {
      await updateMutation.mutateAsync(input)
      await invalidateAdminData()
      setEditingStudent(null)
      setFeedback({ severity: 'success', message: 'Les informations de l’élève ont été mises à jour.' })
    } catch (error) {
      setFeedback({ severity: 'error', message: getErrorMessage(error) })
    }
  }

  const handleStatusChange = async () => {
    if (!statusStudent) return
    const nextStatus = !statusStudent.isActive
    try {
      await statusMutation.mutateAsync({ studentId: statusStudent.id, isActive: nextStatus })
      await invalidateAdminData()
      setFeedback({
        severity: 'success',
        message: nextStatus ? 'Le compte élève a été activé.' : 'Le compte élève a été désactivé.',
      })
      setStatusStudent(null)
    } catch (error) {
      setFeedback({ severity: 'error', message: getErrorMessage(error) })
    }
  }

  const handlePasswordReset = async (password: string) => {
    if (!passwordStudent) return
    try {
      await passwordMutation.mutateAsync({ studentId: passwordStudent.id, password })
      setFeedback({ severity: 'success', message: 'Le mot de passe temporaire a été enregistré.' })
      setPasswordStudent(null)
    } catch (error) {
      setFeedback({ severity: 'error', message: getErrorMessage(error) })
    }
  }

  return (
    <Stack spacing={4}>
      <AdminPageHeader
        title="Élèves"
        description="Créez les accès, gérez les pseudonymes et contrôlez les comptes autorisés."
        action={
          <Button variant="contained" onClick={() => setCreateOpen(true)}>
            Créer un élève
          </Button>
        }
      />

      {feedback && (
        <Alert severity={feedback.severity} onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      <Paper variant="outlined" className="p-4">
        <Box
          component="form"
          onSubmit={handleSearch}
          className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_190px_150px_auto]"
        >
          <TextField
            label="Rechercher un pseudonyme ou e-mail"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            size="small"
          />
          <FormControl size="small">
            <InputLabel id="student-sort-label">Trier par</InputLabel>
            <Select
              labelId="student-sort-label"
              label="Trier par"
              value={options.sortBy}
              onChange={(event) =>
                setOptions((current) => ({
                  ...current,
                  sortBy: event.target.value as StudentListOptions['sortBy'],
                  page: 0,
                }))
              }
            >
              <MenuItem value="display_name">Pseudonyme</MenuItem>
              <MenuItem value="email">E-mail</MenuItem>
              <MenuItem value="created_at">Date de création</MenuItem>
              <MenuItem value="total_sessions">Nombre de parties</MenuItem>
              <MenuItem value="best_score">Meilleur score</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel id="student-direction-label">Ordre</InputLabel>
            <Select
              labelId="student-direction-label"
              label="Ordre"
              value={options.sortDirection}
              onChange={(event) =>
                setOptions((current) => ({
                  ...current,
                  sortDirection: event.target.value as StudentListOptions['sortDirection'],
                  page: 0,
                }))
              }
            >
              <MenuItem value="asc">Croissant</MenuItem>
              <MenuItem value="desc">Décroissant</MenuItem>
            </Select>
          </FormControl>
          <Button type="submit" variant="outlined">
            Rechercher
          </Button>
        </Box>
      </Paper>

      {studentsQuery.isPending && <SectionLoader label="Chargement des élèves…" />}
      {studentsQuery.isError && (
        <QueryError
          message="La liste des élèves n’a pas pu être chargée."
          onRetry={() => void studentsQuery.refetch()}
        />
      )}
      {studentsQuery.data && studentsQuery.data.items.length === 0 && (
        <EmptyState
          title="Aucun élève trouvé"
          description={options.search ? 'Essayez une autre recherche.' : 'Créez le premier compte élève.'}
        />
      )}
      {studentsQuery.data && studentsQuery.data.items.length > 0 && (
        <Paper variant="outlined" className="overflow-hidden">
          <TableContainer>
            <Table sx={{ minWidth: 980 }} aria-label="Liste des élèves">
              <TableHead>
                <TableRow>
                  <TableCell>Élève</TableCell>
                  <TableCell>Identifiant</TableCell>
                  <TableCell>État</TableCell>
                  <TableCell align="right">Parties</TableCell>
                  <TableCell align="right">Meilleur score</TableCell>
                  <TableCell>Créé le</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {studentsQuery.data.items.map((student) => (
                  <TableRow key={student.id} hover>
                    <TableCell>
                      <Typography sx={{ fontWeight: 800 }}>{student.displayName}</Typography>
                    </TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={student.isActive ? 'success' : 'default'}
                        label={student.isActive ? 'Actif' : 'Désactivé'}
                      />
                    </TableCell>
                    <TableCell align="right">{student.totalSessions}</TableCell>
                    <TableCell align="right">{student.bestScore}</TableCell>
                    <TableCell>{formatDateTime(student.createdAt)}</TableCell>
                    <TableCell align="right">
                      <Box className="flex justify-end gap-1">
                        <Button component={Link} to={`/admin/eleves/${student.id}`} size="small">
                          Historique
                        </Button>
                        <Button size="small" onClick={() => setEditingStudent(student)}>
                          Modifier
                        </Button>
                        <Button size="small" onClick={() => setPasswordStudent(student)}>
                          Mot de passe
                        </Button>
                        <Button
                          size="small"
                          color={student.isActive ? 'error' : 'success'}
                          onClick={() => setStatusStudent(student)}
                        >
                          {student.isActive ? 'Désactiver' : 'Activer'}
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={studentsQuery.data.total}
            page={options.page}
            rowsPerPage={options.pageSize}
            rowsPerPageOptions={[10, 25, 50]}
            labelRowsPerPage="Élèves par page"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} sur ${count}`}
            onPageChange={(_, page) => setOptions((current) => ({ ...current, page }))}
            onRowsPerPageChange={(event) =>
              setOptions((current) => ({
                ...current,
                pageSize: Number(event.target.value),
                page: 0,
              }))
            }
          />
        </Paper>
      )}

      {createOpen && (
        <StudentFormDialog
          key="create-student"
          busy={createMutation.isPending}
          onClose={() => setCreateOpen(false)}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
        />
      )}
      {editingStudent && (
        <StudentFormDialog
          key={editingStudent.id}
          student={editingStudent}
          busy={updateMutation.isPending}
          onClose={() => setEditingStudent(null)}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
        />
      )}
      {passwordStudent && (
        <PasswordResetDialog
          key={passwordStudent.id}
          student={passwordStudent}
          busy={passwordMutation.isPending}
          onClose={() => setPasswordStudent(null)}
          onConfirm={handlePasswordReset}
        />
      )}
      <ConfirmDialog
        open={Boolean(statusStudent)}
        title={statusStudent?.isActive ? 'Désactiver ce compte ?' : 'Réactiver ce compte ?'}
        description={
          statusStudent?.isActive
            ? `L’accès de ${statusStudent.displayName} sera bloqué côté authentification et côté données.`
            : `${statusStudent?.displayName ?? 'Cet élève'} pourra de nouveau se connecter.`
        }
        confirmLabel={statusStudent?.isActive ? 'Désactiver' : 'Réactiver'}
        destructive={Boolean(statusStudent?.isActive)}
        busy={statusMutation.isPending}
        onCancel={() => setStatusStudent(null)}
        onConfirm={() => void handleStatusChange()}
      />
    </Stack>
  )
}
