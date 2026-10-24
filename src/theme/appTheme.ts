import { createTheme } from '@mui/material/styles'

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#6842c2',
      dark: '#47258f',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#f47b36',
      dark: '#bf4d17',
      contrastText: '#24150d',
    },
    background: {
      default: '#fffaf3',
      paper: '#ffffff',
    },
    text: {
      primary: '#27213c',
      secondary: '#625c72',
    },
    success: {
      main: '#16836a',
    },
  },
  shape: {
    borderRadius: 18,
  },
  typography: {
    fontFamily: '"Nunito", "Segoe UI", system-ui, sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 900,
      '@media (max-width:600px)': { fontSize: '1.65rem' },
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 850,
      '@media (max-width:600px)': { fontSize: '1.5rem' },
    },
    h3: {
      fontSize: '1.8rem',
      fontWeight: 800,
      '@media (max-width:600px)': { fontSize: '1.4rem' },
    },
    h4: {
      fontSize: '1.55rem',
      fontWeight: 800,
      '@media (max-width:600px)': { fontSize: '1.25rem' },
    },
    h5: {
      fontSize: '1.3rem',
      fontWeight: 800,
      '@media (max-width:600px)': { fontSize: '1.1rem' },
    },
    h6: {
      fontSize: '1.1rem',
      fontWeight: 800,
      '@media (max-width:600px)': { fontSize: '0.95rem' },
    },
    body1: {
      fontSize: '1rem',
      '@media (max-width:600px)': { fontSize: '0.9rem' },
    },
    body2: {
      fontSize: '0.875rem',
      '@media (max-width:600px)': { fontSize: '0.8rem' },
    },
    button: {
      fontSize: '0.9rem',
      fontWeight: 800,
      textTransform: 'none',
      '@media (max-width:600px)': { fontSize: '0.8rem' },
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 48,
          borderRadius: 14,
          boxShadow: 'none',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 24,
        },
      },
    },
  },
})
