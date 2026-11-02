/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
/**
 * Example integration of TaskComments functionality
 * This file demonstrates how to integrate the TaskComments component
 * with existing task management features
 */

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { IconButton } from 'react-native-paper';
import { Text, Card } from './StyledText';
import { colors } from '../defaultTheme';
import { TaskCommentIndicator } from './TaskCommentIndicator';
import type { TaskItemDetailsResponse } from '@larisarozin/dodone-shared';

interface TaskItemCardProps {
  task: TaskItemDetailsResponse;
  onPress: () => void;
  onCommentPress: () => void;
  commentCount?: number; // This would come from your comment API or local state
}

/**
 * Enhanced Task Item Card that includes comment functionality
 * This shows how to integrate comments into your existing task display
 */
export const TaskItemCard: React.FC<TaskItemCardProps> = ({
  task,
  onPress,
  onCommentPress,
  commentCount = 0,
}) => {
  return (
    <Card 
      style={styles.taskCard} 
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Task: ${task.name}${task.description ? `, ${task.description}` : ''}${commentCount > 0 ? `, ${commentCount} comments` : ''}`}
      accessibilityHint="Tap to edit task"
    >
      <Card.Content>
        <View style={styles.taskHeader}>
          <View style={styles.taskInfo}>
            <Text variant="titleMedium" style={styles.taskTitle}>
              {task.name}
            </Text>
            {task.description && (
              <Text variant="bodySmall" style={styles.taskDescription}>
                {task.description}
              </Text>
            )}
          </View>
          
          <View style={styles.taskActions}>
            {/* Comment Indicator - only show if there are comments */}
            {commentCount > 0 && (
              <TaskCommentIndicator
                commentCount={commentCount}
                onPress={onCommentPress}
                size="small"
              />
            )}
            
            {/* Other action buttons */}
            <IconButton
              icon="comment-plus-outline"
              size={20}
              onPress={onCommentPress}
              style={styles.actionButton}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Add comment"
              accessibilityHint="Tap to add a comment to this task"
            />
          </View>
        </View>
      </Card.Content>
    </Card>
  );
};

/**
 * Hook for managing comment counts for multiple tasks
 * This would typically be used in your task list screens
 */
export const useTaskCommentCounts = (taskIds: number[]) => {
  const [commentCounts, setCommentCounts] = useState<Record<number, number>>({});
  
  // This would typically fetch comment counts for all tasks
  // You could implement this by:
  // 1. Making individual API calls for each task
  // 2. Creating a bulk comment count API endpoint
  // 3. Including comment counts in your task list response
  
  React.useEffect(() => {
    // Example implementation - replace with actual API calls
    const fetchCommentCounts = async () => {
      // This is where you would call your comment count API
      // For now, returning mock data
      const mockCounts: Record<number, number> = {};
      taskIds.forEach(id => {
        mockCounts[id] = Math.floor(Math.random() * 10); // Mock random comment count
      });
      setCommentCounts(mockCounts);
    };
    
    if (taskIds.length > 0) {
      fetchCommentCounts();
    }
  }, [taskIds]);
  
  const getCommentCount = (taskId: number) => commentCounts[taskId] || 0;
  
  const updateCommentCount = (taskId: number, count: number) => {
    setCommentCounts(prev => ({ ...prev, [taskId]: count }));
  };
  
  return { getCommentCount, updateCommentCount };
};

/**
 * Example of how to integrate this into your MainAppScreen or task list
 */
export const TaskListWithComments: React.FC<{
  tasks: TaskItemDetailsResponse[];
  navigation: any;
}> = ({ tasks, navigation }) => {
  const taskIds = tasks.map(task => task.id);
  const { getCommentCount } = useTaskCommentCounts(taskIds);
  
  const handleTaskPress = (task: TaskItemDetailsResponse) => {
    navigation.navigate('TaskEdit', { taskItem: task });
  };
  
  const handleCommentPress = (task: TaskItemDetailsResponse) => {
    navigation.navigate('TaskComments', {
      taskId: task.id,
      taskName: task.name,
    });
  };
  
  return (
    <View style={styles.container}>
      {tasks.map((task) => (
        <TaskItemCard
          key={task.id}
          task={task}
          commentCount={getCommentCount(task.id)}
          onPress={() => handleTaskPress(task)}
          onCommentPress={() => handleCommentPress(task)}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  taskCard: {
    marginBottom: 12,
    backgroundColor: colors.backgroundPaper,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  taskInfo: {
    flex: 1,
    marginRight: 12,
  },
  taskTitle: {
    color: colors.textPrimary,
    fontWeight: '600',
    marginBottom: 4,
  },
  taskDescription: {
    color: colors.textSecondary,
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    margin: 0,
  },
});

export default TaskListWithComments;
