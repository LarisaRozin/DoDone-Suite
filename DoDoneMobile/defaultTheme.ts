/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 *
 * @format
 */

import { StyleSheet } from 'react-native';
import {
  configureFonts,
  MD3LightTheme as DefaultTheme,
} from 'react-native-paper';

export const fonts = {
  fredoka: 'Fredoka-Regular',
  fredokaMedium: 'Fredoka-Medium',
  fredokaSemiBold: 'Fredoka-SemiBold', 
  fredokaBold: 'Fredoka-Bold',
  roboto: 'Roboto',
  helvetica: 'Helvetica',
  arial: 'Arial',
  // fallback to system font if not available
  default: 'System',
};

export const colors = {
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
};

const fontConfig = {
    bodySmall: {
      fontFamily: fonts.roboto,
      fontSize: 12,
      fontWeight: '400' as const,
      letterSpacing: 0.4,
      lineHeight: 16,
      color: colors.textSecondary,
    },
    bodyMedium: {
      fontFamily: fonts.roboto,
      fontSize: 14,
      fontWeight: '400' as const,
      letterSpacing: 0.25,
      lineHeight: 20,
      color: colors.textSecondary,
    },
    bodyLarge: {
      fontFamily: fonts.roboto,
      fontSize: 16,
      fontWeight: '400' as const,
      letterSpacing: 0.15,
      lineHeight: 24,
      color: colors.textSecondary,
    },
    labelSmall: {
      fontFamily: fonts.roboto,
      fontSize: 11,
      fontWeight: '500' as const,
      letterSpacing: 0.5,
      lineHeight: 16,
      color: colors.textPrimary,
    },
    labelMedium: {
      fontFamily: fonts.roboto,
      fontSize: 12,
      fontWeight: '500' as const,
      letterSpacing: 0.5,
      lineHeight: 16,
      color: colors.textPrimary,
    },
    labelLarge: {
      fontFamily: fonts.roboto,
      fontSize: 14,
      fontWeight: '500' as const,
      letterSpacing: 0.1,
      lineHeight: 20,
      color: colors.textPrimary,
    },    titleSmall: {
      fontFamily: fonts.fredokaMedium,
      fontSize: 14,
      fontWeight: '500' as const,
      letterSpacing: 0.1,
      lineHeight: 20,
      color: colors.textPrimary,
    },
    titleMedium: {
      fontFamily: fonts.fredokaSemiBold,
      fontSize: 16,
      fontWeight: '600' as const,
      letterSpacing: 0.15,
      lineHeight: 24,
      color: colors.textPrimary,
    },
    titleLarge: {
      fontFamily: fonts.fredokaBold,
      fontSize: 22,
      fontWeight: '700' as const,
      letterSpacing: 0,
      lineHeight: 28,
      color: colors.textPrimary,
    },
    headlineSmall: {
      fontFamily: fonts.fredokaMedium,
      fontSize: 18,
      fontWeight: '500' as const,
      letterSpacing: 0,
      lineHeight: 32,
      color: colors.textSecondary,
    },
    headlineMedium: {
      fontFamily: fonts.fredokaSemiBold,
      fontSize: 24,
      fontWeight: '600' as const,
      letterSpacing: 0,
      lineHeight: 36,
      color: colors.highlight,
    },
    headlineLarge: {
      fontFamily: fonts.fredokaBold,
      fontSize: 32,
      fontWeight: '700' as const,
      letterSpacing: 0,
      lineHeight: 40,
      color: colors.highlight,
    },
    displaySmall: {
      fontFamily: fonts.fredoka,
      fontSize: 36,
      fontWeight: '400' as const,
      letterSpacing: 0,
      lineHeight: 44,
      color: colors.highlight,
    },
    displayMedium: {
      fontFamily: fonts.fredoka,
      fontSize: 45,
      fontWeight: '400' as const,
      letterSpacing: 0,
      lineHeight: 52,
      color: colors.highlight,
    },
    displayLarge: {
      fontFamily: fonts.fredoka,
      fontSize: 57,
      fontWeight: '400' as const,
      letterSpacing: -0.25,
      lineHeight: 64,
      color: colors.highlight,
    },
    default: {
      fontFamily: fonts.roboto,
      fontSize: 14,
      fontWeight: '400' as const,
      letterSpacing: 0.25,
      lineHeight: 20,
      color: colors.textSecondary
    },
};

export const styles = StyleSheet.create({
  // Container Styles
  primaryContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: colors.backgroundDefault,
    width: '100%',
    padding: 12,
  },
  secondaryContainer: {
    backgroundColor: colors.backgroundDefault,
    justifyContent: 'flex-start',
    padding: 16,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundDefault,
  },
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: colors.backgroundDefault,
    padding: 16,
  },
  scrollContainerFullScreen: {
    flexGrow: 1,
    backgroundColor: colors.backgroundDefault,
    padding: 16,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    minHeight: '100%',
  },
  divider: {
    height: 5,
    backgroundColor: colors.divider,
    marginVertical: 8,
  },
  // Card and Surface Styles
  card: {
    backgroundColor: colors.backgroundPaper,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    elevation: 3,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  gameCard: {
    backgroundColor: colors.backgroundPaper,
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    borderWidth: 2,
    borderColor: colors.primary,
    elevation: 5,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  surface: {
    backgroundColor: colors.backgroundPaper,
    borderRadius: 8,
    padding: 12,
    elevation: 1,
  },
  
  // Typography Styles
  primaryTitle: {
    marginBottom: 6,
    textAlign: 'center',
    color: colors.highlight,
  },
  primarySubtitle: {
    textAlign: 'center',
    marginBottom: 8,
    color: colors.textSecondary,
    width: '100%',
  },
  sectionTitle: {
    marginBottom: 12,
    marginTop: 2,
    color: colors.textPrimary,
  },
  gameTitle: {
    fontFamily: fonts.fredokaBold,
    width: '100%',
    textAlign: 'center',
    marginBottom: 16,
    color: colors.highlight,
    textShadowColor: colors.shadow,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  
  // Button Styles
  buttonRow: { 
    flexDirection: 'row', 
    gap: 16, 
    marginTop: 24,
    justifyContent: 'center',
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    margin: 6,
    minWidth: 120,
    elevation: 2,
  },
  primaryButton: {
    backgroundColor: colors.buttonPrimary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    elevation: 3,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  secondaryButton: {
    backgroundColor: colors.buttonSecondary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    elevation: 2,
  },
  accentButton: {
    backgroundColor: colors.buttonAccent,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    elevation: 2,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 22,
    borderRadius: 25,
    color: colors.secondaryDark,
    minWidth: 200,
  },
  gameButton: {
    backgroundColor: colors.buttonPrimary,
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: colors.primaryLight,
    elevation: 5,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    marginVertical: 8,
    minWidth: 200,
  },
  
  // Button Text Styles
  primaryButtonText: {
    fontFamily: fonts.fredokaSemiBold,
    color: colors.textOnPrimary,
    textAlign: 'center',
    fontSize: 16,
  },
  secondaryButtonText: {
    fontFamily: fonts.fredokaSemiBold,
    color: colors.textOnSecondary,
    textAlign: 'center',
    fontSize: 16,
  },
  accentButtonText: {
    fontFamily: fonts.fredokaSemiBold,
    color: colors.textOnPrimary,
    textAlign: 'center',
    fontSize: 16,
  },
  outlineButtonText: {
    fontFamily: fonts.fredokaSemiBold,
    color: colors.primary,
    textAlign: 'center',
    fontSize: 16,
  },
   outlineButtonTextSmall: {
    fontFamily: fonts.fredokaMedium,
    color: colors.primary,
    textAlign: 'center',
    fontSize: 10,
  },
  
  // Input Styles
  input: {
    marginBottom: 16,
    backgroundColor: colors.backgroundPaper,
  },
  formContainer: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  formContainerLandscape: {
    width: '100%',
    alignSelf: 'center',
    paddingRight: 46,
    paddingLeft: 16,
    paddingTop: 16,
  },
  
  // Layout Styles
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Spacing
  marginVertical: {
    marginVertical: 8,
  },
  marginHorizontal: {
    marginHorizontal: 8,
  },
  paddingVertical: {
    paddingVertical: 12,
  },
  paddingHorizontal: {
    paddingHorizontal: 16,
  },
  
  // Game-specific styles
  gameElement: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.backgroundPaper,
    padding: 12,
    elevation: 3,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 4,
  },
  badge: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  badgeText: {
    color: colors.textOnPrimary,
    fontSize: 12,
    fontWeight: 'bold',
  },
});




export const defaultTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    onPrimary: colors.textOnPrimary,
    primaryContainer: colors.primaryLight,
    onPrimaryContainer: colors.primaryDark,
    secondary: colors.secondary,
    onSecondary: colors.textOnSecondary,
    secondaryContainer: colors.secondaryLight,
    onSecondaryContainer: colors.secondaryDark,
    tertiary: colors.accent,
    onTertiary: colors.textOnPrimary,
    tertiaryContainer: colors.accentLight,
    onTertiaryContainer: colors.accentDark,
    error: colors.error,
    onError: colors.textOnPrimary,
    errorContainer: colors.errorLight,
    onErrorContainer: colors.error,
    surface: colors.backgroundPaper,
    onSurface: colors.textOnBackground,
    surfaceVariant: colors.backgroundDefault,
    onSurfaceVariant: colors.textSecondary,
    background: colors.backgroundDefault,
    onBackground: colors.textOnBackground,
    outline: colors.border,
    outlineVariant: colors.divider,
    inverseSurface: colors.textPrimary,
    inverseOnSurface: colors.backgroundDefault,
    inversePrimary: colors.primaryLight,
    elevation: {
      level0: 'transparent',
      level1: colors.backgroundPaper,
      level2: colors.backgroundPaper,
      level3: colors.backgroundPaper,
      level4: colors.backgroundPaper,
      level5: colors.backgroundPaper,
    },
  },
  fonts: configureFonts({config: fontConfig}),
};

