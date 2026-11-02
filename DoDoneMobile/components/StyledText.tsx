/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */

import React from 'react';
import { 
  Text as PaperText, 
  Button as PaperButton, 
  Card as PaperCard,
  Snackbar as PaperSnackbar,
  HelperText as PaperHelperText,
  Chip as PaperChip,
  Dialog as PaperDialog,
  Portal as PaperPortal,
  Appbar as PaperAppbar
} from 'react-native-paper';

/**
 * Wrapper component for react-native-paper's Text component
 * This fixes TypeScript strict children prop requirements after package updates
 */
export const Text = (props: any) => {
  return <PaperText {...props} />;
};

/**
 * Wrapper component for react-native-paper's Button component
 * This fixes TypeScript strict children prop requirements after package updates
 */
export const Button = (props: any) => {
  return <PaperButton {...props} />;
};

/**
 * Wrapper component for react-native-paper's Card component
 * This fixes TypeScript strict children prop requirements after package updates
 */
export const Card = Object.assign(
  (props: any) => {
    return <PaperCard {...props} />;
  },
  {
    Content: (props: any) => {
      return <PaperCard.Content {...props} />;
    },
    Title: (props: any) => {
      return <PaperCard.Title {...props} />;
    },
    Cover: (props: any) => {
      return <PaperCard.Cover {...props} />;
    },
    Actions: (props: any) => {
      return <PaperCard.Actions {...props} />;
    },
  }
);

/**
 * Wrapper component for react-native-paper's Snackbar component
 * This fixes TypeScript strict children prop requirements after package updates
 */
export const Snackbar = (props: any) => {
  return <PaperSnackbar {...props} />;
};

/**
 * Wrapper component for react-native-paper's HelperText component
 * This fixes TypeScript strict children prop requirements after package updates
 */
export const HelperText = (props: any) => {
  return <PaperHelperText {...props} />;
};

/**
 * Wrapper component for react-native-paper's Chip component
 * This fixes TypeScript strict children prop requirements after package updates
 */
export const Chip = (props: any) => {
  return <PaperChip {...props} />;
};

/**
 * Wrapper component for react-native-paper's Dialog component
 * This fixes TypeScript strict children prop requirements after package updates
 */
export const Dialog = Object.assign(
  (props: any) => {
    return <PaperDialog {...props} />;
  },
  {
    Title: (props: any) => {
      return <PaperDialog.Title {...props} />;
    },
    Content: (props: any) => {
      return <PaperDialog.Content {...props} />;
    },
    Actions: (props: any) => {
      return <PaperDialog.Actions {...props} />;
    },
  }
);

/**
 * Wrapper component for react-native-paper's Portal component
 * This fixes TypeScript strict children prop requirements after package updates
 */
export const Portal = (props: any) => {
  return <PaperPortal {...props} />;
};

/**
 * Wrapper component for react-native-paper's Appbar component
 * This fixes TypeScript strict children prop requirements after package updates
 */
export const Appbar = Object.assign(
  (props: any) => {
    return <PaperAppbar {...props} />;
  },
  {
    Header: (props: any) => {
      return <PaperAppbar.Header {...props} />;
    },
    Action: (props: any) => {
      return <PaperAppbar.Action {...props} />;
    },
    BackAction: (props: any) => {
      return <PaperAppbar.BackAction {...props} />;
    },
    Content: (props: any) => {
      return <PaperAppbar.Content {...props} />;
    },
  }
);

export default Text;
