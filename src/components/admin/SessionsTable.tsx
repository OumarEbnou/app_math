import {
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import type { GameSessionSummary } from '../../models/Admin'
import { calculateAccuracy, formatDateTime, formatGameMode } from '../../utils/formatters'

interface SessionsTableProps {
  sessions: GameSessionSummary[]
  onDelete?: (session: GameSessionSummary) => void
}

export function SessionsTable({ sessions, onDelete }: SessionsTableProps) {
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table sx={{ minWidth: 780 }} aria-label="Résultats des parties">
        <TableHead>
          <TableRow>
            <TableCell>Élève</TableCell>
            <TableCell>Mode</TableCell>
            <TableCell align="right">Score</TableCell>
            <TableCell align="right">Réussite</TableCell>
            <TableCell>Date</TableCell>
            {onDelete && <TableCell align="right">Action</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {sessions.map((session) => (
            <TableRow key={session.id} hover>
              <TableCell>
                <Typography sx={{ fontWeight: 800 }}>{session.studentName}</Typography>
              </TableCell>
              <TableCell>
                <Chip
                  size="small"
                  color={session.mode === 'all_tables' ? 'secondary' : 'primary'}
                  variant="outlined"
                  label={formatGameMode(session.mode, session.selectedTable)}
                />
              </TableCell>
              <TableCell align="right">
                <Typography sx={{ fontWeight: 900 }}>{session.score}</Typography>
              </TableCell>
              <TableCell align="right">
                {calculateAccuracy(session.correctAnswers, session.totalQuestions)} %
              </TableCell>
              <TableCell>{formatDateTime(session.endedAt)}</TableCell>
              {onDelete && (
                <TableCell align="right">
                  <Button color="error" size="small" onClick={() => onDelete(session)}>
                    Supprimer
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
