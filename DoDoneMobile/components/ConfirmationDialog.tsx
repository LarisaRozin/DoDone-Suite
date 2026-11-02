/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import React from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { Text, Button, Card } from './StyledText';
import { colors, fonts } from '../defaultTheme';

export interface ConfirmationDialogButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

export interface ConfirmationDialogProps {
  visible: boolean;
  title: string;
  message: string;
  buttons: ConfirmationDialogButton[];
  onDismiss?: () => void;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  visible,
  title,
  message,
  buttons,
  onDismiss,
}) => {
  const handleButtonPress = (button: ConfirmationDialogButton) => {
    if (button.onPress) {
      button.onPress();
    }
    if (onDismiss) {
      onDismiss();
    }
  };

  const getButtonStyle = (style?: string) => {
    switch (style) {
      case 'destructive':
        return {
          backgroundColor: colors.error,
          textColor: colors.textOnPrimary,
        };
      case 'cancel':
        return {
          backgroundColor: 'transparent',
          textColor: colors.textSecondary,
          borderColor: colors.textSecondary,
          bordered: true,
        };
      default:
        return {
          backgroundColor: colors.primary,
          textColor: colors.textOnPrimary,
        };
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onDismiss}
      accessible={true}
      accessibilityLabel="Confirmation dialog"
      accessibilityRole="alert"
    >
      <View 
        style={localStyles.overlay}
        accessible={false}
      >
        <Card 
          style={localStyles.dialogCard}
          accessible={true}
          accessibilityRole="none"
          accessibilityLabel={`Confirmation dialog: ${title}`}
        >
          <Card.Content style={localStyles.dialogContent}>
            <Text 
              variant="headlineSmall" 
              style={localStyles.title}
              accessible={true}
              accessibilityRole="header"
              accessibilityLabel={`Dialog title: ${title}`}
            >
              {title}
            </Text>
            
            <Text 
              variant="bodyLarge" 
              style={localStyles.message}
              accessible={true}
              accessibilityRole="text"
              accessibilityLabel={`Dialog message: ${message}`}
            >
              {message}
            </Text>

            <View 
              style={localStyles.buttonContainer}
              accessible={false}
            >
              {buttons.map((button, index) => {
                const buttonStyle = getButtonStyle(button.style);
                const accessibilityHint = button.style === 'destructive' ? 'Warning: This action cannot be undone' : 'Double tap to confirm';
                return (
                  <Button
                    key={index}
                    mode={buttonStyle.bordered ? 'outlined' : 'contained'}
                    onPress={() => handleButtonPress(button)}
                    style={[
                      localStyles.button,
                      {
                        backgroundColor: buttonStyle.backgroundColor,
                        borderColor: buttonStyle.borderColor,
                      },
                    ]}
                    labelStyle={[
                      localStyles.buttonText,
                      { color: buttonStyle.textColor },
                    ]}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={button.text}
                    accessibilityHint={accessibilityHint}
                  >
                    {button.text}
                  </Button>
                );
              })}
            </View>
          </Card.Content>
        </Card>
      </View>
    </Modal>
  );
};

// Utility function to mimic Alert.alert API
export const showConfirmationDialog = (
  title: string,
  message: string,
  buttons: ConfirmationDialogButton[],
  setDialogState: (state: { visible: boolean; title: string; message: string; buttons: ConfirmationDialogButton[] }) => void
) => {
  setDialogState({
    visible: true,
    title,
    message,
    buttons,
  });
};

const localStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogCard: {
    backgroundColor: colors.backgroundPaper,
    borderRadius: 16,
    minWidth: 280,
    maxWidth: '90%',
    elevation: 8,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  dialogContent: {
    padding: 24,
  },
  title: {
    fontFamily: fonts.fredokaSemiBold,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontFamily: fonts.fredoka,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    borderRadius: 20,
    elevation: 2,
  },
  buttonText: {
    fontFamily: fonts.fredokaSemiBold,
    fontSize: 12,
  },
});

export default ConfirmationDialog;
