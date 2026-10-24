import { useState, type FormEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AdminPageHeader } from '../components/admin/AdminPageHeader'
import { ConfirmDialog } from '../components/admin/ConfirmDialog'
import { QueryError, SectionLoader } from '../components/admin/QueryState'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import type { GameSettings } from '../models/Admin'
import { getGameSettings, updateGameSettings } from '../services/adminService'
import {
  hasValidationErrors,
  validateGameSettings,
  type SettingsField,
  type ValidationErrors,
} from '../utils/adminValidation'
import { getErrorMessage } from '../utils/errors'
import { formatDateTime } from '../utils/formatters'

type NumericSettingsField = Exclude<keyof GameSettings, 'enabledTables' | 'updatedAt'>

interface NumberSettingFieldProps {
  label: string
  value: number
  helperText: string
  error?: string
  min: number
  max: number
  onChange: (value: number) => void
}

function NumberSettingField({
  label,
  value,
  helperText,
  error,
  min,
  max,
  onChange,
}: NumberSettingFieldProps) {
  return (
    <TextField
      label={label}
      type="number"
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      error={Boolean(error)}
      helperText={error ?? helperText}
      slotProps={{ htmlInput: { min, max, step: 1 } }}
      fullWidth
    />
  )
}

function SettingsEditor({ initialSettings }: { initialSettings: GameSettings }) {
  const queryClient = useQueryClient()
  const [settings, setSettings] = useState(initialSettings)
  const [errors, setErrors] = useState<ValidationErrors<SettingsField>>({})
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [feedback, setFeedback] = useState<{ severity: 'success' | 'error'; message: string } | null>(null)

  const mutation = useMutation({
    mutationFn: updateGameSettings,
  })

  const updateNumber = (field: NumericSettingsField, value: number) => {
    setSettings((current) => ({ ...current, [field]: value }))
  }

  const toggleTable = (table: number) => {
    setSettings((current) => ({
      ...current,
      enabledTables: current.enabledTables.includes(table)
        ? current.enabledTables.filter((currentTable) => currentTable !== table)
        : [...current.enabledTables, table].sort((left, right) => left - right),
    }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validation = validateGameSettings(settings)
    setErrors(validation)
    if (hasValidationErrors(validation)) {
      setFeedback({ severity: 'error', message: 'Corrigez les champs signalés avant d’enregistrer.' })
      return
    }
    setFeedback(null)
    setConfirmOpen(true)
  }

  const confirmSave = async () => {
    try {
      const savedSettings = await mutation.mutateAsync(settings)
      setSettings(savedSettings)
      setErrors({})
      setConfirmOpen(false)
      setFeedback({ severity: 'success', message: 'Les paramètres des prochaines parties sont enregistrés.' })
      queryClient.setQueryData(['admin', 'settings'], savedSettings)
      await queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    } catch (error) {
      setConfirmOpen(false)
      setFeedback({ severity: 'error', message: getErrorMessage(error) })
    }
  }

  return (
    <>
      {feedback && (
        <Alert severity={feedback.severity} onClose={() => setFeedback(null)}>
          {feedback.message}
        </Alert>
      )}

      <Alert severity="info">
        Les changements s’appliquent uniquement aux nouvelles parties. Chaque ancienne partie conserve une copie immuable de ses règles.
      </Alert>

      <Paper component="form" variant="outlined" className="p-5 sm:p-7" onSubmit={handleSubmit}>
        <Stack spacing={4}>
          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              Temps et progression
            </Typography>
            <Box className="grid gap-4 md:grid-cols-2">
              <NumberSettingField
                label="Durée d’une partie (secondes)"
                value={settings.gameDurationSeconds}
                helperText="De 10 à 900 secondes."
                error={errors.gameDurationSeconds}
                min={10}
                max={900}
                onChange={(value) => updateNumber('gameDurationSeconds', value)}
              />
              <NumberSettingField
                label="Délai d’une réponse rapide (ms)"
                value={settings.fastAnswerLimitMs}
                helperText="De 250 à 60 000 ms."
                error={errors.fastAnswerLimitMs}
                min={250}
                max={60_000}
                onChange={(value) => updateNumber('fastAnswerLimitMs', value)}
              />
              <NumberSettingField
                label="Réponses rapides avant ×2"
                value={settings.fastAnswersForMultiplier}
                helperText="De 1 à 100 réponses."
                error={errors.fastAnswersForMultiplier}
                min={1}
                max={100}
                onChange={(value) => updateNumber('fastAnswersForMultiplier', value)}
              />
              <NumberSettingField
                label="Multiplicateur maximal"
                value={settings.maxMultiplier}
                helperText="De ×1 à ×100."
                error={errors.maxMultiplier}
                min={1}
                max={100}
                onChange={(value) => updateNumber('maxMultiplier', value)}
              />
              <NumberSettingField
                label="Durée du retour correct/faux (ms)"
                value={settings.feedbackDurationMs}
                helperText="De 0 à 10 000 ms."
                error={errors.feedbackDurationMs}
                min={0}
                max={10_000}
                onChange={(value) => updateNumber('feedbackDurationMs', value)}
              />
              <NumberSettingField
                label="Places dans le classement"
                value={settings.leaderboardSize}
                helperText="5 par défaut, maximum 20."
                error={errors.leaderboardSize}
                min={1}
                max={20}
                onChange={(value) => updateNumber('leaderboardSize', value)}
              />
            </Box>
          </Box>

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              Plage des facteurs
            </Typography>
            <Box className="grid gap-4 md:grid-cols-2">
              <NumberSettingField
                label="Facteur minimum"
                value={settings.minFactor}
                helperText="Entre 0 et 20."
                error={errors.minFactor}
                min={0}
                max={20}
                onChange={(value) => updateNumber('minFactor', value)}
              />
              <NumberSettingField
                label="Facteur maximum"
                value={settings.maxFactor}
                helperText="Entre le minimum et 20."
                error={errors.maxFactor}
                min={0}
                max={20}
                onChange={(value) => updateNumber('maxFactor', value)}
              />
            </Box>
          </Box>

          <Box>
            <Typography variant="h5" component="h2" gutterBottom>
              Tables disponibles
            </Typography>
            <Typography color={errors.enabledTables ? 'error' : 'text.secondary'} sx={{ mb: 2 }}>
              {errors.enabledTables ?? 'Choisissez au moins une table entre 1 et 20.'}
            </Typography>
            <Box className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-5">
              {Array.from({ length: 20 }, (_, index) => index + 1).map((table) => (
                <FormControlLabel
                  key={table}
                  control={
                    <Checkbox
                      checked={settings.enabledTables.includes(table)}
                      onChange={() => toggleTable(table)}
                    />
                  }
                  label={`Table de ${table}`}
                />
              ))}
            </Box>
          </Box>

          <Box className="flex flex-col gap-3 border-t border-purple-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <Typography variant="body2" color="text.secondary">
              Dernière mise à jour : {formatDateTime(settings.updatedAt)}
            </Typography>
            <Button type="submit" variant="contained" disabled={mutation.isPending}>
              Vérifier et enregistrer
            </Button>
          </Box>
        </Stack>
      </Paper>

      <ConfirmDialog
        open={confirmOpen}
        title="Appliquer ces paramètres ?"
        description="Ils seront utilisés au démarrage des prochaines parties. Les résultats existants ne seront pas recalculés."
        confirmLabel="Enregistrer les paramètres"
        busy={mutation.isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void confirmSave()}
      />
    </>
  )
}

export function AdminSettingsPage() {
  useDocumentTitle('Paramètres des jeux')
  const settingsQuery = useQuery({
    queryKey: ['admin', 'settings'],
    queryFn: getGameSettings,
  })

  return (
    <Stack spacing={4}>
      <AdminPageHeader
        title="Paramètres des jeux"
        description="Adaptez la durée, la difficulté et les règles de progression pour les prochaines parties."
      />
      {settingsQuery.isPending && <SectionLoader label="Chargement des paramètres…" />}
      {settingsQuery.isError && (
        <QueryError
          message="Les paramètres n’ont pas pu être chargés."
          onRetry={() => void settingsQuery.refetch()}
        />
      )}
      {settingsQuery.data && (
        <SettingsEditor key={settingsQuery.data.updatedAt} initialSettings={settingsQuery.data} />
      )}
    </Stack>
  )
}
