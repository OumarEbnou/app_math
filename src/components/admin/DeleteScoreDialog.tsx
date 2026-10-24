import { useState, type FormEvent } from 'react'
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from '@mui/material'
import type { GameSessionSummary } from '../../models/Admin'

interface DeleteScoreDialogProps {
  session: GameSessionSummary
  busy: boolean
  onClose: () => void
  onConfirm: (reason: string) => Promise<void>
}

export function DeleteScoreDialog({ session, busy, onClose, onConfirm }: DeleteScoreDialogProps) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const normalizedReason = reason.trim()
    if (normalizedReason.length < 3 || normalizedReason.length > 250) {
      setError('Le motif doit contenir entre 3 et 250 caractères.')
      return
    }
    setError(null)
    await onConfirm(normalizedReason)
  }

  return (
    <Dialog open onClose={busy ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Supprimer définitivement ce score ?</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Le score de {session.studentName} ({session.score} points) et ses réponses seront supprimés. Une trace sans secret sera conservée dans le journal d’audit.
        </DialogContentText>
        <form id="delete-score-form" onSubmit={(event) => void handleSubmit(event)}>
          <TextField
            label="Motif de la suppression"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            error={Boolean(error)}
            helperText={error ?? 'Obligatoire pour la traçabilité.'}
            multiline
            minRows={3}
            fullWidth
            autoFocus
            disabled={busy}
            slotProps={{ htmlInput: { maxLength: 250 } }}
          />
        </form>
      </DialogContent>
      <DialogActions className="px-6 pb-5">
        <Button onClick={onClose} disabled={busy}>
          Annuler
        </Button>
        <Button
          type="submit"
          form="delete-score-form"
          variant="contained"
          color="error"
          disabled={busy}
        >
          {busy ? <CircularProgress color="inherit" size={22} /> : 'Supprimer le score'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
