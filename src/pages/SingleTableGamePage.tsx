import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
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
import { calculateAccuracy } from '../utils/formatters'
import { AppIcon } from '../components/AppIcon'

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
    <Stack spacing={{ xs: 2, sm: 3 }} sx={{ maxWidth: 760, mx: 'auto' }}>
      <Box className="text-center">
        <Typography aria-hidden="true" sx={{ fontSize: { xs: '2rem', sm: '3rem' } }}>
          🏆
        </Typography>
        <Typography variant="h5" component="h1">
          Partie terminée !
        </Typography>
        <Typography variant="h3" color="primary.main" sx={{ mt: 0.5 }}>
          {score} pts
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
            <Tooltip title="Réessayer">
              <IconButton color="inherit" size="small" onClick={onRetrySave} aria-label="Réessayer">
                <AppIcon name="replay" size={20} />
              </IconButton>
            </Tooltip>
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

      <Box className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
          <Paper key={label} variant="outlined" className="p-2 text-center sm:p-3">
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
              {label}
            </Typography>
            <Typography variant="h6" component="p" sx={{ mt: 0.25 }}>
              {value}
            </Typography>
          </Paper>
        ))}
      </Box>

      <Stack direction="row" spacing={2} sx={{ justifyContent: 'center' }}>
        <Tooltip title={isStarting ? 'Préparation…' : 'Rejouer'}>
          <span>
            <IconButton
              color="primary"
              onClick={onReplay}
              disabled={isStarting || saveStatus === 'saving'}
              aria-label="Rejouer"
              sx={{ width: 52, height: 52, border: 1, borderColor: 'primary.main' }}
            >
              {isStarting ? <CircularProgress size={22} /> : <AppIcon name="replay" size={26} />}
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Accueil">
          <IconButton
            component={Link}
            to="/eleve"
            color="primary"
            aria-label="Accueil"
            sx={{ width: 52, height: 52, border: 1, borderColor: 'divider' }}
          >
            <AppIcon name="home" size={26} />
          </IconButton>
        </Tooltip>
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
    inputRef.current?.focus({ preventScroll: true })
    if (!result.accepted && !result.expired) {
      validationLockRef.current = false
    }
  }

  const remainingGameMs = game ? getRemainingGameTimeMs(game, nowMs) : 0
  const remainingFastMs = game ? getRemainingFastTimeMs(game, nowMs) : 0
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
      <Stack spacing={2} sx={{ alignItems: 'center' }} className="py-4 text-center">
        <Typography variant="h4" component="h1">
          {modeLabel}
        </Typography>
        {startError && <Alert severity="error">{startError}</Alert>}
        <Button variant="contained" onClick={() => void beginGame()} disabled={isStarting}>
          {isStarting ? 'Préparation…' : 'Démarrer'}
        </Button>
        {mode === 'single_table' && (
          <Button component={Link} to="/eleve/jeu/une-table">
            Autre table
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
    <Stack spacing={2} sx={{ maxWidth: 720, mx: 'auto' }}>
      <LinearProgress
        variant="determinate"
        value={(remainingGameMs / (game.settings.gameDurationSeconds * 1000)) * 100}
        color={remainingGameMs <= 10_000 ? 'secondary' : 'primary'}
        aria-label="Temps restant dans la partie"
        sx={{ height: 6, borderRadius: 999 }}
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '72px minmax(0, 1fr)', sm: '108px minmax(0, 1fr)' },
          gap: { xs: 1, sm: 2 },
          alignItems: 'stretch',
        }}
      >
        <Stack component="aside" spacing={1} aria-label="Informations de la partie">
          {[
            {
              label: 'Temps',
              value: formatSeconds(remainingGameMs),
              background: remainingGameMs <= 10_000 ? '#fff0e7' : '#f1edff',
              color: remainingGameMs <= 10_000 ? '#a33c0b' : '#47258f',
            },
            { label: 'Score', value: game.score, background: '#f1edff', color: '#47258f' },
            { label: 'Coef.', value: `×${game.multiplier}`, background: '#fff0e7', color: '#a33c0b' },
            { label: 'Série', value: game.fastStreak, background: '#e7f7f1', color: '#126653' },
          ].map((item) => (
            <Paper
              key={item.label}
              variant="outlined"
              sx={{
                flex: 1,
                minHeight: { xs: 54, sm: 66 },
                px: { xs: 0.5, sm: 1 },
                py: 0.75,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: item.background,
                borderColor: 'transparent',
              }}
            >
              <Typography
                component="span"
                sx={{ fontSize: { xs: '0.62rem', sm: '0.75rem' }, fontWeight: 800, color: item.color }}
              >
                {item.label}
              </Typography>
              <Typography
                component="strong"
                sx={{
                  fontSize: { xs: '1rem', sm: '1.3rem' },
                  fontWeight: 900,
                  lineHeight: 1.15,
                  color: item.color,
                }}
              >
                {item.value}
              </Typography>
            </Paper>
          ))}
        </Stack>

        <Paper className="p-2 text-center shadow-[0_12px_35px_rgba(72,45,125,0.1)] sm:p-6">
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 800 }}>
            Q{game.question?.position} ·{' '}
            {game.mode === 'all_tables' ? 'Mix' : `Table ${game.selectedTable}`}
          </Typography>
          <Typography
            component="p"
            sx={{ fontSize: { xs: '1.8rem', sm: '3.5rem' }, fontWeight: 900, my: { xs: 1.25, sm: 2 } }}
          >
            {game.question?.leftFactor} × {game.question?.rightFactor} = ?
          </Typography>

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Stack spacing={1.25} sx={{ alignItems: 'center' }}>
              <TextField
                inputRef={inputRef}
                value={answer}
                onChange={(event) => {
                  if (game.status === 'playing') {
                    setAnswer(event.target.value)
                  }
                }}
                error={Boolean(answerError)}
                helperText={answerError}
                label="Réponse"
                type="text"
                size="small"
                autoComplete="off"
                slotProps={{
                  htmlInput: {
                    inputMode: 'numeric',
                    pattern: '-?[0-9]*',
                    'aria-label': 'Ta réponse numérique',
                    'aria-disabled': game.status !== 'playing',
                  },
                }}
                sx={{ maxWidth: 220, width: '100%' }}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={game.status !== 'playing'}
                onPointerDown={(event) => event.preventDefault()}
                sx={{ minWidth: { xs: 120, sm: 160 } }}
              >
                Valider
              </Button>
            </Stack>
          </Box>

          {game.status === 'feedback' && (
            <Alert
              severity={game.feedback?.kind === 'wrong' ? 'error' : 'success'}
              role="status"
              aria-live="assertive"
              sx={{ justifyContent: 'center', mt: 1.5, py: 0 }}
            >
              {feedbackText}
            </Alert>
          )}
        </Paper>
      </Box>

      <Box>
        <Box className="mb-1 flex justify-between gap-3">
          <Typography variant="body2" sx={{ fontWeight: 800 }}>
            Rapide
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

    </Stack>
  )
}

export function SingleTableGamePage() {
  return <GamePage mode="single_table" />
}

export function AllTablesGamePage() {
  return <GamePage mode="all_tables" />
}
