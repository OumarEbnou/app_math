import { useState, type FormEvent } from 'react'
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  TextField,
} from '@mui/material'
import type { AdminStudent } from '../../models/Admin'
import { validatePassword } from '../../utils/adminValidation'

interface PasswordResetDialogProps {
  student: AdminStudent
  busy: boolean
  onClose: () => void
  onConfirm: (password: string) => Promise<void>
}

export function PasswordResetDialog({
  student,
  busy,
  onClose,
  onConfirm,
}: PasswordResetDialogProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validationError = validatePassword(password)
    setError(validationError)
    if (validationError) {
      return
    }
    await onConfirm(password)
  }

  return (
    <Dialog open onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Définissez un nouveau mot de passe temporaire pour {student.displayName}. Cette action sera journalisée, mais jamais le mot de passe.
        </DialogContentText>
        <Stack component="form" id="password-reset-form" onSubmit={(event) => void handleSubmit(event)}>
          <TextField
            label="Nouveau mot de passe"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            error={Boolean(error)}
            helperText={error ?? 'Entre 8 et 128 caractères.'}
            autoComplete="new-password"
            autoFocus
            required
            disabled={busy}
            slotProps={{ htmlInput: { minLength: 8, maxLength: 128 } }}
          />
        </Stack>
      </DialogContent>
      <DialogActions className="px-6 pb-5">
        <Button onClick={onClose} disabled={busy}>
          Annuler
        </Button>
        <Button type="submit" form="password-reset-form" variant="contained" disabled={busy}>
          {busy ? <CircularProgress color="inherit" size={22} /> : 'Confirmer la réinitialisation'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
