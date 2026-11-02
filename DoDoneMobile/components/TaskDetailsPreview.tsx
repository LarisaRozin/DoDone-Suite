/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { IconButton } from 'react-native-paper';
import { Text } from './StyledText';
import { colors } from '../defaultTheme';

interface TaskDetailsPreviewProps {
  taskDetails?: string | null;
  onPress: () => void;
  maxPreviewLength?: number;
  disabled?: boolean;
}

export const TaskDetailsPreview: React.FC<TaskDetailsPreviewProps> = ({
  taskDetails,
  onPress,
  maxPreviewLength = 100,
  disabled = false
}) => {
  const { hasDetails, previewText, detailsLength } = useMemo(() => {
    if (!taskDetails || taskDetails.trim() === '') {
      return {
        hasDetails: false,
        previewText: '',
        detailsLength: 0
      };
    }

    // Strip HTML tags to get plain text for preview
    let stripped = taskDetails.replace(/<[^>]*>/g, '').trim();
    stripped = stripped.replace(/\s+/g, ' '); // Replace multiple spaces/newlines with single space
    stripped = stripped.replace(/&nbsp;/g, ' '); // Replace non-breaking spaces
    const length = stripped.length;
    const preview = length > maxPreviewLength 
      ? stripped.substring(0, maxPreviewLength).trim() + '...'
      : stripped;

    return {
      hasDetails: length > 0,
      previewText: preview,
      detailsLength: length
    };
  }, [taskDetails, maxPreviewLength]);

  const getStatusIcon = () => {
    if (!hasDetails) return 'text-box-outline';
    return 'text-box';
  };

  const getStatusColor = () => {
    if (!hasDetails) return colors.textSecondary;
    return colors.primary;
  };

  const getStatusText = () => {
    if (!hasDetails) return 'No details';
    return 'Has details';
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        hasDetails ? styles.containerWithDetails : styles.containerEmpty,
        disabled && styles.containerDisabled
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={disabled}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={hasDetails ? `Task details: ${previewText}` : 'No task details'}
      accessibilityHint={hasDetails ? 'Tap to edit task details' : 'Tap to add task details'}
      accessibilityState={{ disabled }}
    >
      <View style={styles.iconContainer}>
        <IconButton
          icon={getStatusIcon()}
          iconColor={getStatusColor()}
          size={24}
          style={styles.statusIcon}
        />
      </View>
      
      <View style={styles.textContainer}>
        <Text variant="bodyMedium" style={[
          styles.statusText,
          { color: getStatusColor() }
        ]}>
          {getStatusText()}
        </Text>
        
        {hasDetails && detailsLength > 0 && (
          <Text variant="bodySmall" style={styles.lengthText}>
            {detailsLength} characters
          </Text>
        )}
        
        {hasDetails && previewText ? (
          <Text variant="bodySmall" style={styles.previewText} numberOfLines={2}>
            {previewText}
          </Text>
        ) : (
          <Text variant="bodySmall" style={styles.emptyText} numberOfLines={1}>
            Tap to add task details
          </Text>
        )}
      </View>
      
      <View style={styles.chevronContainer}>
        <IconButton 
          icon="chevron-right" 
          onPress={onPress}
          style={styles.chevronButton}
          iconColor={colors.primary}
          size={20}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Edit task details"
          accessibilityHint="Opens task details editor"
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginVertical: 8,
    borderWidth: 2,
  },
  containerWithDetails: {
    backgroundColor: colors.primary + '10',
    borderColor: colors.primary + '30',
  },
  containerEmpty: {
    backgroundColor: colors.textSecondary + '08',
    borderColor: colors.textSecondary + '20',
    borderStyle: 'dashed',
  },
  containerDisabled: {
    opacity: 0.4,
  },
  iconContainer: {
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIcon: {
    margin: 0,
    backgroundColor: 'transparent',
  },
  textContainer: {
    flex: 1,
    paddingRight: 8,
  },
  statusText: {
    fontWeight: '600',
    fontSize: 15,
    marginBottom: 2,
  },
  lengthText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '400',
    marginBottom: 4,
  },
  previewText: {
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontStyle: 'italic',
  },
  chevronContainer: {
    marginLeft: 8,
    backgroundColor: colors.backgroundPaper,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronButton: {
    margin: 0,
    backgroundColor: 'transparent',
  },
});

export default TaskDetailsPreview;