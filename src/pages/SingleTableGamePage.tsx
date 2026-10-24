import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  advanceQuestion,
  finishExpiredGame,
  getRemainingFastTimeMs,
  getRemainingGameTimeMs,
  startGame,
  submitAnswer,
} from '../game/gameEngine'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import type { GameState, PlayableGameMode, SavedGameResult } from '../models/Game'
import { createGameAttempt, saveGame } from '../services/gameService'
import { calculateAccuracy, formatDateTime } from '../utils/formatters'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

function formatSeconds(milliseconds: number): string {
  return `${Math.ceil(milliseconds / 1000)} s`
}

function ResultPanel({
  game,
  savedResult,
  saveStatus,
  saveError,
  onRetrySave,
  onReplay,
  isStarting,
}: {
  game: GameState
  savedResult: SavedGameResult | null
  saveStatus: SaveStatus
  saveError: string | null
  onRetrySave: () => void
  onReplay: () => void
  isStarting: boolean
}) {
  const localCorrectAnswers = game.answers.filter((answer) => answer.isCorrect).length
  const localWrongAnswers = game.answers.length - localCorrectAnswers
  const localAverageAnswerTime =
    game.answers.length === 0
      ? null
      : Math.round(
          game.answers.reduce((total, answer) => total + answer.responseTimeMs, 0) /
            game.answers.length,
        )
  const score = savedResult?.officialScore ?? game.score
  const totalQuestions = savedResult?.totalQuestions ?? game.answers.length
  const correctAnswers = savedResult?.correctAnswers ?? localCorrectAnswers
  const wrongAnswers = savedResult?.wrongAnswers ?? localWrongAnswers
  const bestFastStreak = savedResult?.bestFastStreak ?? game.bestFastStreak
  const maxMultiplierReached =
    savedResult?.maxMultiplierReached ?? game.maxMultiplierReached
  const averageAnswerTime = savedResult?.averageAnswerTimeMs ?? localAverageAnswerTime
  const scoreMismatch = savedResult !== null && savedResult.officialScore !== game.score

  return (
    <Stack spacing={3}>
      <Box className="text-center">
        <Typography aria-hidden="true" sx={{ fontSize: '4rem' }}>
          🏆
        </Typography>
        <Typography variant="h3" component="h1" gutterBottom>
          Partie terminée !
        </Typography>
        <Typography variant="h2" color="primary.main">
          {score} points
        </Typography>
      </Box>

      {saveStatus === 'saving' && (
        <Alert icon={<CircularProgress size={20} />} severity="info">
          Vérification du score par Supabase…
        </Alert>
      )}
      {saveStatus === 'saved' && (
        <Alert severity="success">
          Score vérifié et enregistré{savedResult?.created === false ? ' (sans doublon)' : ''}.
        </Alert>
      )}
      {saveStatus === 'error' && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={onRetrySave}>
              Réessayer
            </Button>
          }
        >
          {saveError}
        </Alert>
      )}
      {scoreMismatch && (
        <Alert severity="warning">
          Le serveur a corrigé le score local de {game.score} à {savedResult.officialScore} points.
        </Alert>
      )}

      <Box className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Mode', game.mode === 'all_tables' ? 'Toutes les tables' : `Table de ${game.selectedTable}`],
          ['Questions validées', totalQuestions],
          ['Bonnes réponses', correctAnswers],
          ['Mauvaises réponses', wrongAnswers],
          ['Réussite', `${calculateAccuracy(correctAnswers, totalQuestions)} %`],
          ['Meilleure série rapide', bestFastStreak],
          ['Multiplicateur maximal', `×${maxMultiplierReached}`],
          [
            'Temps moyen',
            averageAnswerTime === null ? '—' : `${Math.round(averageAnswerTime)} ms`,
          ],
          ...(savedResult?.rankingPosition
            ? [
                [
                  savedResult.isPersonalBest ? 'Position' : 'Meilleure position',
                  `#${savedResult.rankingPosition}${savedResult.rankingSize ? ` sur ${savedResult.rankingSize}` : ''}`,
                ],
              ]
            : []),
        ].map(([label, value]) => (
          <Paper key={label} variant="outlined" className="p-4 text-center">
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 800 }}>
              {label}
            </Typography>
            <Typography variant="h5" component="p" sx={{ mt: 0.5 }}>
              {value}
            </Typography>
          </Paper>
        ))}
      </Box>

      <Typography color="text.secondary" className="text-center">
        Partie du{' '}
        {formatDateTime(savedResult?.startedAt ?? new Date(game.startedAtMs).toISOString())}
      </Typography>

      <Stack
        spacing={2}
        sx={{ flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'center' }}
      >
        <Button
          variant="contained"
          onClick={onReplay}
          disabled={isStarting || saveStatus === 'saving'}
        >
          {isStarting ? 'Préparation…' : 'Rejouer'}
        </Button>
        <Button component={Link} to="/eleve" variant="outlined">
          Retour à l’accueil
        </Button>
      </Stack>
    </Stack>
  )
}

function GamePage({ mode }: { mode: PlayableGameMode }) {
  const { table: tableParameter = '' } = useParams()
  const parsedTable = Number(tableParameter)
  const isValidTable = Number.isInteger(parsedTable) && parsedTable >= 1 && parsedTable <= 20
  const selectedTable = mode === 'single_table' && isValidTable ? parsedTable : null
  const isValidSelection = mode === 'all_tables' || selectedTable !== null
  const modeLabel = mode === 'all_tables' ? 'Toutes les tables' : `Table de ${selectedTable}`
  useDocumentTitle(isValidSelection ? modeLabel : 'Table invalide')

  const [game, setGame] = useState<GameState | null>(null)
  const [answer, setAnswer] = useState('')
  const [answerError, setAnswerError] = useState<string | null>(null)
  const [startError, setStartError] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [nowMs, setNowMs] = useState(() => Date.now())
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [saveError, setSaveError] = useState<string | null>(null)
  const [savedResult, setSavedResult] = useState<SavedGameResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const validationLockRef = useRef(false)
  const savingLockRef = useRef(false)
  const clockAnchorRef = useRef<{ epochAtMs: number; performanceAtMs: number } | null>(null)

  const readClock = useCallback(() => {
    const anchor = clockAnchorRef.current
    return anchor
      ? anchor.epochAtMs + (performance.now() - anchor.performanceAtMs)
      : Date.now()
  }, [])

  const beginGame = useCallback(async () => {
    if (!isValidSelection) {
      return
    }
    setIsStarting(true)
    setStartError(null)
    setSaveStatus('idle')
    setSaveError(null)
    setSavedResult(null)
    setAnswer('')
    setAnswerError(null)
    validationLockRef.current = false
    savingLockRef.current = false

    try {
      const requestPerformanceMs = performance.now()
      const attempt = await createGameAttempt(mode, selectedTable)
      const responsePerformanceMs = performance.now()
      clockAnchorRef.current = {
        epochAtMs: attempt.startedAtMs + (responsePerformanceMs - requestPerformanceMs) / 2,
        performanceAtMs: responsePerformanceMs,
      }
      const currentTime = readClock()
      setNowMs(currentTime)
      setGame(startGame(attempt, currentTime, Math.random))
    } catch (error) {
      setGame(null)
      setStartError(error instanceof Error ? error.message : 'La partie n’a pas pu démarrer.')
    } finally {
      setIsStarting(false)
    }
  }, [isValidSelection, mode, readClock, selectedTable])

  const persistGame = useCallback(async (finishedGame: GameState) => {
    if (savingLockRef.current) {
      return
    }
    savingLockRef.current = true
    setSaveStatus('saving')
    setSaveError(null)
    try {
      const result = await saveGame(finishedGame.attemptId, finishedGame.answers)
      setSavedResult(result)
      setSaveStatus('saved')
    } catch (error) {
      setSaveError(
        error instanceof Error
          ? error.message
          : 'Le score n’a pas pu être enregistré. Tu peux réessayer.',
      )
      setSaveStatus('error')
    } finally {
      savingLockRef.current = false
    }
  }, [])

  const gameStatus = game?.status
  const attemptId = game?.attemptId
  const feedbackAnswerCount = game?.answers.length
  const feedbackDurationMs = game?.settings.feedbackDurationMs

  useEffect(() => {
    if (!attemptId || gameStatus === 'finished') {
      return
    }
    const updateClock = () => {
      const currentTime = readClock()
      setNowMs(currentTime)
      setGame((currentGame) =>
        currentGame ? finishExpiredGame(currentGame, currentTime) : currentGame,
      )
    }
    updateClock()
    const interval = window.setInterval(updateClock, 100)
    return () => window.clearInterval(interval)
  }, [attemptId, gameStatus, readClock])

  useEffect(() => {
    if (gameStatus !== 'feedback' || feedbackDurationMs === undefined) {
      return
    }
    const timeout = window.setTimeout(() => {
      const currentTime = readClock()
      setNowMs(currentTime)
      setAnswer('')
      setAnswerError(null)
      setGame((currentGame) => {
        if (!currentGame) {
          return currentGame
        }
        const nextGame = advanceQuestion(currentGame, currentTime, Math.random)
        if (nextGame.status === 'playing') {
          validationLockRef.current = false
        }
        return nextGame
      })
    }, feedbackDurationMs)
    return () => window.clearTimeout(timeout)
  }, [feedbackAnswerCount, feedbackDurationMs, gameStatus, readClock])

  useEffect(() => {
    if (gameStatus === 'playing') {
      inputRef.current?.focus()
    }
  }, [gameStatus, game?.question?.position])

  useEffect(() => {
    if (game?.status === 'finished' && saveStatus === 'idle') {
      const timeout = window.setTimeout(() => void persistGame(game), 0)
      return () => window.clearTimeout(timeout)
    }
  }, [game, persistGame, saveStatus])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    if (!game || game.status !== 'playing' || validationLockRef.current) {
      return
    }
    if (!/^-?\d+$/.test(answer.trim())) {
      setAnswerError('Entre un nombre entier.')
      inputRef.current?.focus()
      return
    }

    validationLockRef.current = true
    const result = submitAnswer(game, Number(answer), readClock())
    setGame(result.state)
    if (!result.accepted && !result.expired) {
      validationLockRef.current = false
    }
  }

  const remainingGameMs = game ? getRemainingGameTimeMs(game, nowMs) : 0
  const remainingFastMs = game ? getRemainingFastTimeMs(game, nowMs) : 0
  const correctAnswers = useMemo(
    () => game?.answers.filter((item) => item.isCorrect).length ?? 0,
    [game?.answers],
  )

  if (!isValidSelection) {
    return (
      <Alert severity="error" action={<Button component={Link} to="/eleve/jeu/une-table">Choisir</Button>}>
        Cette table n’est pas valide.
      </Alert>
    )
  }

  if (game?.status === 'finished') {
    return (
      <ResultPanel
        game={game}
        savedResult={savedResult}
        saveStatus={saveStatus}
        saveError={saveError}
        onRetrySave={() => void persistGame(game)}
        onReplay={() => void beginGame()}
        isStarting={isStarting}
      />
    )
  }

  if (!game) {
    return (
      <Stack spacing={3} sx={{ alignItems: 'center' }} className="py-8 text-center">
        <Chip label={`Jeu · ${mode === 'all_tables' ? 'Toutes les tables' : 'Une table'}`} color="primary" />
        <Typography variant="h3" component="h1">
          {modeLabel}
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 560 }}>
          Le chronomètre démarrera après le clic. Les paramètres seront figés par Supabase pour
          toute la partie.
        </Typography>
        {startError && <Alert severity="error">{startError}</Alert>}
        <Button variant="contained" size="large" onClick={() => void beginGame()} disabled={isStarting}>
          {isStarting ? 'Préparation…' : 'Démarrer la partie'}
        </Button>
        {mode === 'single_table' && (
          <Button component={Link} to="/eleve/jeu/une-table">
            Choisir une autre table
          </Button>
        )}
      </Stack>
    )
  }

  const feedbackText =
    game.feedback?.kind === 'wrong'
      ? `Pas cette fois : la réponse était ${game.feedback.expectedAnswer}.`
      : game.feedback?.kind === 'correct_slow'
        ? `Bonne réponse ! +${game.feedback.pointsAwarded}, mais la série repart à zéro.`
        : game.feedback
          ? `Bravo ! +${game.feedback.pointsAwarded}`
          : ''

  return (
    <Stack spacing={3} sx={{ maxWidth: 820, mx: 'auto' }}>
      <Box className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['Temps', formatSeconds(remainingGameMs)],
          ['Score', game.score],
          ['Multiplicateur', `×${game.multiplier}`],
          ['Série rapide', game.fastStreak],
        ].map(([label, value]) => (
          <Paper key={label} variant="outlined" className="p-3 text-center">
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
              {label}
            </Typography>
            <Typography variant="h5" component="p">
              {value}
            </Typography>
          </Paper>
        ))}
      </Box>

      <LinearProgress
        variant="determinate"
        value={(remainingGameMs / (game.settings.gameDurationSeconds * 1000)) * 100}
        color={remainingGameMs <= 10_000 ? 'secondary' : 'primary'}
        aria-label="Temps restant dans la partie"
      />

      <Paper className="p-5 text-center shadow-[0_18px_55px_rgba(72,45,125,0.12)] sm:p-8">
        <Typography color="text.secondary" sx={{ fontWeight: 800 }}>
          Question {game.question?.position} ·{' '}
          {game.mode === 'all_tables' ? 'Toutes les tables' : `Table de ${game.selectedTable}`}
        </Typography>
        <Typography
          component="p"
          sx={{ fontSize: { xs: '3rem', sm: '4.5rem' }, fontWeight: 900, my: 3 }}
        >
          {game.question?.leftFactor} × {game.question?.rightFactor} = ?
        </Typography>

        {game.status === 'playing' ? (
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Stack spacing={2} sx={{ alignItems: 'center' }}>
              <TextField
                inputRef={inputRef}
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                error={Boolean(answerError)}
                helperText={answerError ?? 'Valide avec Entrée ou le bouton.'}
                label="Ta réponse"
                type="text"
                autoComplete="off"
                slotProps={{
                  htmlInput: {
                    inputMode: 'numeric',
                    pattern: '-?[0-9]*',
                    'aria-label': 'Ta réponse numérique',
                  },
                }}
                sx={{ maxWidth: 280, width: '100%' }}
              />
              <Button type="submit" variant="contained" size="large" sx={{ minWidth: 200 }}>
                Valider
              </Button>
            </Stack>
          </Box>
        ) : (
          <Alert
            severity={game.feedback?.kind === 'wrong' ? 'error' : 'success'}
            role="status"
            aria-live="assertive"
            sx={{ justifyContent: 'center' }}
          >
            {feedbackText}
          </Alert>
        )}
      </Paper>

      <Box>
        <Box className="mb-1 flex justify-between gap-3">
          <Typography variant="body2" sx={{ fontWeight: 800 }}>
            Délai rapide
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {game.status === 'playing' ? formatSeconds(remainingFastMs) : 'Question suivante…'}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          color="success"
          value={(remainingFastMs / game.settings.fastAnswerLimitMs) * 100}
          aria-label="Temps restant pour une réponse rapide"
        />
      </Box>

      <Typography color="text.secondary" className="text-center">
        {correctAnswers} bonne{correctAnswers > 1 ? 's' : ''} réponse
        {correctAnswers > 1 ? 's' : ''} validée{correctAnswers > 1 ? 's' : ''}
      </Typography>
    </Stack>
  )
}

export function SingleTableGamePage() {
  return <GamePage mode="single_table" />
}

export function AllTablesGamePage() {
  return <GamePage mode="all_tables" />
}
