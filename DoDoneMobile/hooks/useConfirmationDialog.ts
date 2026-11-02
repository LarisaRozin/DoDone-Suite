/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import { useState } from 'react';
import { ConfirmationDialogButton } from '../components/ConfirmationDialog';

interface DialogState {
  visible: boolean;
  title: string;
  message: string;
  buttons: ConfirmationDialogButton[];
}

export const useConfirmationDialog = () => {
  const [dialogState, setDialogState] = useState<DialogState>({
    visible: false,
    title: '',
    message: '',
    buttons: [],
  });

  const showDialog = (
    title: string,
    message: string,
    buttons: ConfirmationDialogButton[]
  ) => {
    setDialogState({
      visible: true,
      title,
      message,
      buttons,
    });
  };

  const hideDialog = () => {
    setDialogState(prev => ({
      ...prev,
      visible: false,
    }));
  };

  // Helper function to show a delete confirmation dialog
  const showDeleteConfirmation = (
    itemName: string,
    onConfirm: () => void,
    customTitle?: string,
    customMessage?: string
  ) => {
    const title = customTitle || `Delete ${itemName}`;
    const message = customMessage || `Are you sure you want to delete this ${itemName.toLowerCase()}? This action cannot be undone.`;
    
    showDialog(title, message, [
      { 
        text: 'Cancel', 
        style: 'cancel' as const,
        onPress: hideDialog 
      },
      {
        text: 'Delete',
        style: 'destructive' as const,
        onPress: () => {
          onConfirm();
          hideDialog();
        }
      },
    ]);
  };

  return {
    dialogState,
    showDialog,
    hideDialog,
    showDeleteConfirmation,
  };
};
