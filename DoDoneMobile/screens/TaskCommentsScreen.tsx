/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Appbar } from '../components/StyledText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../defaultTheme';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';
import TaskComments from '../components/TaskComments';

type TaskCommentsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'TaskComments'>;
type TaskCommentsScreenRouteProp = RouteProp<RootStackParamList, 'TaskComments'>;

interface TaskCommentsScreenProps {
  navigation: TaskCommentsScreenNavigationProp;
  route: TaskCommentsScreenRouteProp;
}

export default function TaskCommentsScreen({ navigation, route }: TaskCommentsScreenProps) {
  const { taskId, taskName } = route.params;
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction 
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Return to previous screen"
        />
        <Appbar.Content 
          title="Comments" 
          subtitle={taskName ? `for ${taskName}` : undefined}
          titleStyle={styles.headerTitle}
          subtitleStyle={styles.headerSubtitle}
          accessibilityRole="header"
          accessibilityLabel={taskName ? `Comments for ${taskName}` : "Comments"}
        />
      </Appbar.Header>
      
      <View style={styles.content}>
        <TaskComments taskId={taskId} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundDefault,
  },
  header: {
    backgroundColor: colors.backgroundPaper,
    elevation: 4,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '600',
  },
  headerSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
});
