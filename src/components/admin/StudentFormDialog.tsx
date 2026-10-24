import { useState, type FormEvent } from 'react'
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material'
import type { AdminStudent, CreateStudentInput, UpdateStudentInput } from '../../models/Admin'
import {
  hasValidationErrors,
  validateCreateStudent,
  validateStudentIdentity,
} from '../../utils/adminValidation'

interface StudentFormDialogProps {
  student?: AdminStudent
  busy: boolean
  onClose: () => void
  onCreate: (input: CreateStudentInput) => Promise<void>
  onUpdate: (input: UpdateStudentInput) => Promise<void>
}

export function StudentFormDialog({
  student,
  busy,
  onClose,
  onCreate,
  onUpdate,
}: StudentFormDialogProps) {
  const [email, setEmail] = useState(student?.email ?? '')
  const [displayName, setDisplayName] = useState(student?.displayName ?? '')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Partial<Record<'email' | 'displayName' | 'password', string>>>({})
  const isEditing = Boolean(student)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (student) {
      const validation = validateStudentIdentity({ email, displayName })
      setErrors(validation)
      if (hasValidationErrors(validation)) {
        return
      }
      await onUpdate({ studentId: student.id, email, displayName })
      return
    }

    const input = { email, displayName, password }
    const validation = validateCreateStudent(input)
    setErrors(validation)
    if (hasValidationErrors(validation)) {
      return
    }
    await onCreate(input)
  }

  return (
    <Dialog open onClose={busy ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditing ? 'Modifier l’élève' : 'Créer un compte élève'}</DialogTitle>
      <DialogContent>
        <Stack component="form" id="student-form" spacing={2.5} sx={{ pt: 1 }} onSubmit={(event) => void handleSubmit(event)}>
          <TextField
            label="Pseudonyme affiché"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            error={Boolean(errors.displayName)}
            helperText={errors.displayName ?? 'Ce nom sera visible dans les classements.'}
            autoFocus
            required
            disabled={busy}
            slotProps={{ htmlInput: { maxLength: 80 } }}
          />
          <TextField
            label="Adresse e-mail de connexion"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={Boolean(errors.email)}
            helperText={errors.email}
            autoComplete="off"
            required
            disabled={busy}
          />
          {!isEditing && (
            <TextField
              label="Mot de passe temporaire"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={Boolean(errors.password)}
              helperText={errors.password ?? 'Entre 8 et 128 caractères. Il ne sera jamais journalisé.'}
              autoComplete="new-password"
              required
              disabled={busy}
              slotProps={{ htmlInput: { minLength: 8, maxLength: 128 } }}
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions className="px-6 pb-5">
        <Button onClick={onClose} disabled={busy}>
          Annuler
        </Button>
        <Button type="submit" form="student-form" variant="contained" disabled={busy}>
          {busy ? <CircularProgress color="inherit" size={22} /> : isEditing ? 'Enregistrer' : 'Créer le compte'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
