/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Badge } from 'react-native-paper';
import { Text } from './StyledText';
import { colors } from '../defaultTheme';

interface TaskCommentIndicatorProps {
  commentCount: number;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
}

export const TaskCommentIndicator: React.FC<TaskCommentIndicatorProps> = ({
  commentCount,
  onPress,
  size = 'medium',
}) => {
  if (commentCount === 0) {
    return null; // Don't show anything if no comments
  }

  const getSizes = () => {
    switch (size) {
      case 'small':
        return { iconSize: 16, badgeSize: 18, fontSize: 10 };
      case 'large':
        return { iconSize: 24, badgeSize: 24, fontSize: 14 };
      default: // medium
        return { iconSize: 20, badgeSize: 20, fontSize: 12 };
    }
  };

  const sizes = getSizes();

  const content = (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { width: sizes.iconSize, height: sizes.iconSize }]}>
        <Text 
          style={[
            styles.commentIcon, 
            { fontSize: sizes.iconSize * 0.8, color: colors.primary }
          ]}
        >
          💬
        </Text>
      </View>
      <Badge
        size={sizes.badgeSize}
        style={[styles.badge, { backgroundColor: colors.primary }]}
      >
        {commentCount > 99 ? '99+' : commentCount.toString()}
      </Badge>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity 
        onPress={onPress} 
        style={styles.touchable}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${commentCount} comment${commentCount !== 1 ? 's' : ''}`}
        accessibilityHint="Double tap to view and add comments"
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  touchable: {
    padding: 4,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentIcon: {
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    minWidth: 20,
  },
});

export default TaskCommentIndicator;
