/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Avatar, IconButton } from 'react-native-paper';
import { Text } from './StyledText';
import { colors } from '../defaultTheme';
import { 
  PagedTaskCommentListRequestBuilder,
  useTaskComments,
  TaskCommentResponse
} from '@larisarozin/dodone-shared';
import UserAvatar from './UserAvatar';

interface TaskCommentsPreviewProps {
  taskId: number;
  onPress: () => void;
  maxAvatars?: number;
}

export const TaskCommentsPreview: React.FC<TaskCommentsPreviewProps> = ({
  taskId,
  onPress,
  maxAvatars = 3
}) => {
  // Create the request for fetching comments
  const commentsRequest = useMemo(() => 
    new PagedTaskCommentListRequestBuilder(taskId)
      .setPaging(1, 10) // Get first 10 comments to show recent commenters
      .build(),
    [taskId]
  );

  const { pagedTaskComments } = useTaskComments(commentsRequest);

  // Extract comments and total count
  const comments: TaskCommentResponse[] = useMemo(() => {
    if (pagedTaskComments) {
      if ((pagedTaskComments as any).data && (pagedTaskComments as any).data.data) {
        return (pagedTaskComments as any).data.data || [];
      } else if ((pagedTaskComments as any).data && Array.isArray((pagedTaskComments as any).data)) {
        return (pagedTaskComments as any).data || [];
      } else if (Array.isArray(pagedTaskComments)) {
        return pagedTaskComments || [];
      }
    }
    return [];
  }, [pagedTaskComments]);

  const totalComments = useMemo(() => {
    return (pagedTaskComments as any)?.data?.paging?.totalItems || comments.length || 0;
  }, [pagedTaskComments, comments.length]);

  // Get unique commenters (most recent first)
  const uniqueCommenters = useMemo(() => {
    const commentersMap = new Map();
    
    // Reverse to get most recent first, then add to map (which preserves insertion order)
    [...comments].reverse().forEach(comment => {
      const userId = comment.createdByUser.id;
      if (!commentersMap.has(userId)) {
        commentersMap.set(userId, comment.createdByUser);
      }
    });
    
    return Array.from(commentersMap.values()).slice(0, maxAvatars);
  }, [comments, maxAvatars]);

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Comments preview: ${totalComments === 0 ? 'No comments' : `${totalComments} comment${totalComments !== 1 ? 's' : ''}`}`}
      accessibilityHint="Double tap to open comments modal"
    >
      <View style={styles.avatarsContainer}>
        {uniqueCommenters.map((commenter, index) => (
          <UserAvatar
            key={commenter.id}
            size={32}
            imageUri={commenter.avatarUri}
            firstName={commenter.firstName}
            lastName={commenter.lastName}
            userName={commenter.userName}
            style={[
              styles.avatar,
              index > 0 && styles.overlappingAvatar,
              { zIndex: uniqueCommenters.length - index }
            ]}
            labelStyle={styles.avatarLabel}
          />
        ))}
        {uniqueCommenters.length > maxAvatars && (
          <Avatar.Text
            size={32}
            label={`+${uniqueCommenters.length - maxAvatars}`}
            style={[styles.avatar, styles.overlappingAvatar, styles.extraAvatar]}
            labelStyle={styles.avatarLabel}
          />
        )}
      </View>
      
      <View style={styles.textContainer}>
        <Text variant="bodyMedium" style={styles.commentText}>
          {totalComments === 0 ? 'No comments' : (totalComments === 1 ? '1 comment' : `${totalComments} comments`)}
        </Text>
        {comments.length > 0 ? (
          <Text variant="bodySmall" style={styles.lastComment} numberOfLines={1}>
            {comments[comments.length - 1]?.content || ''}
          </Text>
        ) : (
          <Text variant="bodySmall" style={styles.lastComment} numberOfLines={1}>
            Tap to add the first comment
          </Text>
        )}
      </View>
      
      <View style={styles.chevronContainer}>
        <IconButton 
          icon="chevron-up" 
          onPress={onPress}
          style={styles.chevronButton}
          iconColor={colors.primary}
          size={20}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Open comments"
          accessibilityHint="Double tap to view and add comments"
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.primary,
    borderRadius: 16,
    marginVertical: 8,
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: colors.primaryLight,
  },
  avatarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  avatar: {
    borderWidth: 2,
    borderColor: colors.avatarOutline,
    backgroundColor: colors.avatarBg,
  },
  avatarLabel: {
    color: colors.textOnPrimary,
    fontWeight: '700',
    fontSize: 10,
  },
  overlappingAvatar: {
    marginLeft: -8,
  },
  extraAvatar: {
    backgroundColor: colors.avatarBg,
    borderColor: colors.avatarOutline,
  },
  textContainer: {
    flex: 1,
  },
  commentText: {
    fontWeight: '700',
    color: colors.textOnPrimary,
    fontSize: 15,
    marginBottom: 2,
  },
  lastComment: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    fontStyle: 'italic',
  },
  chevronContainer: {
    marginLeft: 8,
    backgroundColor: colors.backgroundPaper,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronButton: {
    margin: 0,
    backgroundColor: 'transparent',
  },
});

export default TaskCommentsPreview;
