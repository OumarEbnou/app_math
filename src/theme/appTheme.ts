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
    h1: { fontWeight: 900 },
    h2: { fontWeight: 850 },
    h3: { fontWeight: 800 },
    button: { fontWeight: 800, textTransform: 'none' },
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
