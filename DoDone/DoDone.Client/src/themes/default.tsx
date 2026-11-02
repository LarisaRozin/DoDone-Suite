/*
 * Copyright (c) 2025 LarisaRozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import { createTheme } from '@mui/material/styles';

// Extend the Material-UI theme interface to include our custom colors and typography
declare module '@mui/material/styles' {
  interface TypographyVariants {
    logoTitle: React.CSSProperties;
  }

  // Allow configuration using `createTheme`
  interface TypographyVariantsOptions {
    logoTitle?: React.CSSProperties;
  }
}

// Update module augmentation to make custom variant available
declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    logoTitle: true;
  }
}

declare module '@mui/material/styles' {
  interface Palette {
    dodone: {
      // Primary Orange (from color palette - around 700-800 range)
      primary: string;
      primaryLight: string;
      primaryDark: string;
      primaryContrastText: string;
      
      // Complementary Blue (from color palette)
      secondary: string;
      secondaryLight: string;
      secondaryDark: string;
      secondaryContrastText: string;
      
      // Triadic Green (for success, highlights)
      accent: string;
      accentLight: string;
      accentDark: string;
      
      // Status colors
      success: string;
      successLight: string;
      error: string;
      errorLight: string;
      warning: string;
      warningLight: string;
      
      // Game-like vibrant backgrounds
      backgroundDefault: string;
      backgroundPaper: string;
      backgroundAccent: string;
      
      // Text colors for good contrast
      textPrimary: string;
      textSecondary: string;
      textOnPrimary: string;
      textOnSecondary: string;
      textOnBackground: string;
      
      // Game elements
      avatarBg: string;
      avatarOutline: string;
      highlight: string;
      highlightOutline: string;
      
      // Interactive elements
      buttonPrimary: string;
      buttonSecondary: string;
      buttonAccent: string;
      buttonDisabled: string;
      
      // Borders and dividers
      border: string;
      divider: string;
      shadow: string;
    };
  }

  interface PaletteOptions {
    dodone?: {
      primary?: string;
      primaryLight?: string;
      primaryDark?: string;
      primaryContrastText?: string;
      secondary?: string;
      secondaryLight?: string;
      secondaryDark?: string;
      secondaryContrastText?: string;
      accent?: string;
      accentLight?: string;
      accentDark?: string;
      success?: string;
      successLight?: string;
      error?: string;
      errorLight?: string;
      warning?: string;
      warningLight?: string;
      backgroundDefault?: string;
      backgroundPaper?: string;
      backgroundAccent?: string;
      textPrimary?: string;
      textSecondary?: string;
      textOnPrimary?: string;
      textOnSecondary?: string;
      textOnBackground?: string;
      avatarBg?: string;
      avatarOutline?: string;
      highlight?: string;
      highlightOutline?: string;
      buttonPrimary?: string;
      buttonSecondary?: string;
      buttonAccent?: string;
      buttonDisabled?: string;
      border?: string;
      divider?: string;
      shadow?: string;
    };
  }
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#F57C00',
      light: '#FFB74D',
      dark: '#E65100',
      contrastText: '#fff',
    },
    secondary: {
      main: '#2196F3',
      light: '#64B5F6',
      dark: '#1565C0',
      contrastText: '#fff',
    },
    success: {
      main: '#4CAF50',
      light: '#81C784',
    },
    error: {
      main: '#F44336',
      light: '#E57373',
    },
    warning: {
      main: '#FF9800',
      light: '#FFB74D',
    },
    background: {
      default: '#FFF8E1', // Very light warm background
      paper: '#FFECB3', // Slightly darker warm paper
    },
    text: {
      primary: '#E65100', // Dark orange for main text
      secondary: '#1565C0', // Dark blue for secondary text
    },
    dodone: {
      // Primary Orange (from color palette - around 700-800 range)
      primary: '#F57C00',
      primaryLight: '#FFB74D',
      primaryDark: '#E65100',
      primaryContrastText: '#fff',
      
      // Complementary Blue (from color palette)
      secondary: '#2196F3',
      secondaryLight: '#64B5F6',
      secondaryDark: '#1565C0',
      secondaryContrastText: '#fff',
      
      // Triadic Green (for success, highlights)
      accent: '#4CAF50',
      accentLight: '#81C784',
      accentDark: '#388E3C',
      
      // Status colors
      success: '#4CAF50',
      successLight: '#81C784',
      error: '#F44336',
      errorLight: '#E57373',
      warning: '#FF9800',
      warningLight: '#FFB74D',
      
      // Game-like vibrant backgrounds
      backgroundDefault: '#FFF8E1', // Very light warm background
      backgroundPaper: '#FFECB3', // Slightly darker warm paper
      backgroundAccent: '#E8F5E8', // Light green accent areas
      
      // Text colors for good contrast
      textPrimary: '#E65100', // Dark orange for main text
      textSecondary: '#1565C0', // Dark blue for secondary text
      textOnPrimary: '#fff',
      textOnSecondary: '#fff',
      textOnBackground: '#424242',
      
      // Game elements
      avatarBg: '#4CAF50',
      avatarOutline: '#FFB74D',
      highlight: '#FF5722', // Bright red-orange for highlights
      highlightOutline: '#FFB74D',
      
      // Interactive elements
      buttonPrimary: '#F57C00',
      buttonSecondary: '#2196F3',
      buttonAccent: '#4CAF50',
      buttonDisabled: '#BDBDBD',
      
      // Borders and dividers
      border: '#E0E0E0',
      divider: '#EEEEEE',
      shadow: 'rgba(0, 0, 0, 0.1)',
    },
  },
  typography: {
    fontFamily: '"Fredoka", "Roboto", "Helvetica", "Arial", sans-serif',
    logoTitle: {
      fontFamily: '"Fredoka", "Roboto", "Helvetica", "Arial", sans-serif',
      fontSize: '1.5rem', // 24px equivalent
      fontWeight: 600,
      color: '#fff', // primaryContrastText
      textAlign: 'left',
    },
    h1: {
      fontFamily: '"Fredoka", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    h2: {
      fontFamily: '"Fredoka", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    h3: {
      fontFamily: '"Fredoka", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    h4: {
      fontFamily: '"Fredoka", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    h5: {
      fontFamily: '"Fredoka", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    h6: {
      fontFamily: '"Fredoka", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    subtitle1: {
      fontFamily: '"Fredoka", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    subtitle2: {
      fontFamily: '"Fredoka", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    body1: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    },
    body2: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    },
    button: {
      fontFamily: '"Fredoka", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    caption: {
      fontFamily: '"Fredoka", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    overline: {
      fontFamily: '"Fredoka", "Roboto", "Helvetica", "Arial", sans-serif',
    },
  },
  components: {
    MuiAvatar: {
      styleOverrides: { 
        root: {
          backgroundColor: '#3ddf00',
          color: '#fff',
          outline: '2px solid #ffcb80',
          // outlineOffset: '2px',
        },
      },  
    },
  },
});

export default theme;