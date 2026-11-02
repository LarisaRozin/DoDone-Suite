/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { 
  Text, 
  Card, 
  TextInput, 
  Button, 
  Snackbar,
  ActivityIndicator,
  Icon 
} from 'react-native-paper';
import { colors } from '../defaultTheme';
import { 
  TaskCommentResponse, 
  TaskCommentCreateRequest, 
  TaskCommentUpdateRequest,
  PagedTaskCommentListRequestBuilder,
  TaskCommentPagingUtils,
  useAuth,
  useConfig,
  useTaskComments
} from '@larisarozin/dodone-shared';
import { createApiClient } from '../utils/apiClientWrapper';
import { ConfirmationDialog } from './ConfirmationDialog';
import { useConfirmationDialog } from '../hooks/useConfirmationDialog';
import UserAvatar from './UserAvatar';
import { formatDateTimeForDisplay } from '../utils/dateUtils';

interface TaskCommentsProps {
  taskId: number;
  onCommentCountChange?: (count: number) => void;
  onCommentsChanged?: () => void;
}

interface CommentItemProps {
  comment: TaskCommentResponse;
  currentUserId?: number;
  onEdit: (comment: TaskCommentResponse) => void;
  onDelete: (commentId: number) => void;
  showDeleteConfirmation: (itemName: string, onConfirm: () => void, customTitle?: string, customMessage?: string) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({ comment, currentUserId, onEdit, onDelete, showDeleteConfirmation }) => {
  const isOwnComment = comment.createdByUser.id === currentUserId;

  const formatDate = (date: string | null | undefined) => {
    return formatDateTimeForDisplay(date);
  };

  const handleEdit = () => {
    onEdit(comment);
  };

  const handleDelete = () => {
    showDeleteConfirmation('Comment', () => onDelete(comment.id));
  };

  return (
    <Card 
      style={styles.commentCard}
      accessible={true}
      accessibilityRole="none"
      accessibilityLabel={`Comment by ${(() => {
        const firstName = comment.createdByUser?.firstName?.trim() || '';
        const lastName = comment.createdByUser?.lastName?.trim() || '';
        return `${firstName} ${lastName}`.trim() || comment.createdByUser?.userName || 'Unknown User';
      })()}, ${formatDate(comment.createdAt)}`}
    >
      <Card.Content>
        <View 
          style={styles.commentHeader}
          accessible={false}
        >
          <View 
            style={styles.commentAuthor}
            accessible={false}
          >
            <UserAvatar
              size={36}
              imageUri={comment.createdByUser.avatarUri}
              firstName={comment.createdByUser.firstName}
              lastName={comment.createdByUser.lastName}
              userName={comment.createdByUser.userName}
              style={styles.avatar}
              labelStyle={styles.avatarLabel}
            />
            <View 
              style={styles.commentMeta}
              accessible={false}
            >
              <Text 
                variant="labelMedium" 
                style={styles.authorName}
                accessible={true}
                accessibilityRole="text"
                accessibilityLabel={`Comment author: ${(() => {
                  const firstName = comment.createdByUser?.firstName?.trim() || '';
                  const lastName = comment.createdByUser?.lastName?.trim() || '';
                  return `${firstName} ${lastName}`.trim() || comment.createdByUser?.userName || 'Unknown User';
                })()}`}
              >
                {(() => {
                  const firstName = comment.createdByUser?.firstName?.trim() || '';
                  const lastName = comment.createdByUser?.lastName?.trim() || '';
                  return `${firstName} ${lastName}`.trim() || comment.createdByUser?.userName || 'Unknown User';
                })()}
              </Text>
              <Text 
                variant="bodySmall" 
                style={styles.commentDate}
                accessible={true}
                accessibilityRole="text"
                accessibilityLabel={`Comment date: ${formatDate(comment.createdAt)}${comment.updatedAt && comment.updatedAt !== comment.createdAt ? ', edited' : ''}`}
              >
                {formatDate(comment.createdAt)}{comment.updatedAt && comment.updatedAt !== comment.createdAt ? ' (edited)' : ''}
              </Text>
            </View>
          </View>
          {isOwnComment && (
            <View 
              style={styles.commentActions}
              accessible={false}
            >
              <TouchableOpacity
                onPress={() => {
                  handleEdit();
                }}
                style={styles.actionButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Edit comment"
                accessibilityHint="Double tap to edit this comment"
              >
                <Icon 
                  source="pencil" 
                  size={18} 
                  color={colors.primary}
                />
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => {
                  handleDelete();
                }}
                style={styles.actionButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Delete comment"
                accessibilityHint="Double tap to delete this comment. This action cannot be undone."
              >
                <Icon 
                  source="delete" 
                  size={18} 
                  color={colors.error}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
        <Text 
          variant="bodyMedium" 
          style={styles.commentContent}
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel={`Comment content: ${comment.content}`}
        >
          {comment.content}
        </Text>
      </Card.Content>
    </Card>
  );
};

export const TaskComments: React.FC<TaskCommentsProps> = ({ taskId, onCommentCountChange, onCommentsChanged }) => {
  const { user, token } = useAuth();
  const { baseUrl } = useConfig();
  const [newCommentText, setNewCommentText] = useState('');
  const [editingComment, setEditingComment] = useState<TaskCommentResponse | null>(null);
  const [editText, setEditText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Confirmation dialog
  const { dialogState, showDeleteConfirmation, hideDialog } = useConfirmationDialog();

  // Create the request for fetching comments
  const commentsRequest = useMemo(() => 
    new PagedTaskCommentListRequestBuilder(taskId)
      .setPaging(1, 20) // Show 20 comments per page initially
      .build(),
    [taskId]
  );

  const { pagedTaskComments, loadingTaskComments, refreshTaskComments } = useTaskComments(commentsRequest);

  // Force logging every render
  
  // Access the actual comments data - handle both possible structures
  let comments = [];
  if (pagedTaskComments) {
    if ((pagedTaskComments as any).data && (pagedTaskComments as any).data.data) {
      comments = (pagedTaskComments as any).data.data;
    } else if ((pagedTaskComments as any).data && Array.isArray((pagedTaskComments as any).data)) {
      comments = (pagedTaskComments as any).data;
    } else if (Array.isArray(pagedTaskComments)) {
      comments = pagedTaskComments;
    }
  }

  // Notify parent of comment count changes
  useEffect(() => {
    if (onCommentCountChange) {
      // Access the paging info from data.paging
      const totalItems = (pagedTaskComments as any)?.data?.paging?.totalItems || 0;
      onCommentCountChange(totalItems);
    }
  }, [pagedTaskComments, onCommentCountChange]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      refreshTaskComments(commentsRequest);
    } catch (err) {
      console.error('Error refreshing comments:', err);
      setError('Failed to refresh comments. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSubmitNewComment = async () => {
    if (!newCommentText.trim()) {
      setError('Please enter a comment');
      return;
    }

    if (!token) {
      setError('Authentication required');
      return;
    }

    setSubmitting(true);
    try {
      const apiClient = createApiClient(baseUrl, token);
      const createRequest: TaskCommentCreateRequest = {
        taskId,
        content: newCommentText.trim()
      };

      const response = await apiClient.comments.create(createRequest);
      if (response.success) {
        setNewCommentText('');
        setSuccess('Comment added successfully');
        // Refresh comments list
        refreshTaskComments(commentsRequest);
        // Notify parent components that comments have changed
        if (onCommentsChanged) {
          onCommentsChanged();
        }
      } else {
        setError(response.message || 'Failed to add comment');
      }
    } catch (err) {
      console.error('Error creating comment:', err);
      setError('Failed to add comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditComment = (comment: TaskCommentResponse) => {
    setEditingComment(comment);
    setEditText(comment.content);
  };

  const handleSaveEdit = async () => {
    if (!editText.trim()) {
      setError('Please enter a comment');
      return;
    }

    if (!editingComment || !token) {
      return;
    }

    setSubmitting(true);
    try {
      const apiClient = createApiClient(baseUrl, token);
      const updateRequest: TaskCommentUpdateRequest = {
        id: editingComment.id,
        content: editText.trim()
      };

      const response = await apiClient.comments.update(updateRequest);
      if (response.success) {
        setEditingComment(null);
        setEditText('');
        setSuccess('Comment updated successfully');
        // Refresh comments list
        refreshTaskComments(commentsRequest);
        // Notify parent components that comments have changed
        if (onCommentsChanged) {
          onCommentsChanged();
        }
      } else {
        setError(response.message || 'Failed to update comment');
      }
    } catch (err) {
      console.error('Error updating comment:', err);
      setError('Failed to update comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditText('');
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!token) {
      setError('Authentication required');
      return;
    }

    setSubmitting(true);
    try {
      const apiClient = createApiClient(baseUrl, token);
      const response = await apiClient.comments.delete(commentId);
      if (response.success) {
        setSuccess('Comment deleted successfully');
        // Refresh comments list
        refreshTaskComments(commentsRequest);
        // Notify parent components that comments have changed
        if (onCommentsChanged) {
          onCommentsChanged();
        }
      } else {
        setError(response.message || 'Failed to delete comment');
      }
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError('Failed to delete comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoadMore = () => {
    // Access the paging info from data.paging
    const paging = (pagedTaskComments as any)?.data?.paging;
    if (!paging?.hasNext) return;
    
    const nextPageRequest = TaskCommentPagingUtils.getNextPageRequest(commentsRequest, paging);
    if (nextPageRequest) {
      refreshTaskComments(nextPageRequest);
    }
  };

  const renderComment = ({ item }: { item: TaskCommentResponse }) => {
    return (
      <CommentItem
        comment={item}
        currentUserId={user?.id}
        onEdit={handleEditComment}
        onDelete={handleDeleteComment}
        showDeleteConfirmation={showDeleteConfirmation}
      />
    );
  };

  const renderFooter = () => {
    if (!loadingTaskComments) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      accessible={false}
    >
      {/* Edit Comment Modal */}
      {editingComment && (
        <KeyboardAvoidingView 
          style={styles.editModalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
          accessible={false}
        >
          <Card 
            style={styles.editCommentCard}
            accessible={true}
            accessibilityRole="none"
            accessibilityLabel="Edit comment dialog"
          >
            <Card.Content style={styles.editCommentContent}>
              <Text 
                variant="titleMedium" 
                style={styles.editTitle}
                accessible={true}
                accessibilityRole="header"
                accessibilityLabel="Edit Comment"
              >
                Edit Comment
              </Text>
              <TextInput
                value={editText}
                onChangeText={setEditText}
                mode="outlined"
                multiline
                numberOfLines={4}
                style={styles.commentInput}
                disabled={submitting}
                theme={{ 
                  roundness: 12,
                  colors: {
                    background: colors.backgroundPaper,
                    surface: colors.backgroundPaper,
                  }
                }}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
                placeholder="Edit your comment..."
                placeholderTextColor={colors.textSecondary}
                accessible={true}
                accessibilityRole="text"
                accessibilityLabel="Edit comment text input"
                accessibilityHint="Enter your comment text here"
              />
              <View 
                style={styles.editActions}
                accessible={false}
              >
                <Button
                  mode="outlined"
                  onPress={handleCancelEdit}
                  disabled={submitting}
                  style={styles.cancelButton}
                  labelStyle={styles.cancelButtonText}
                  theme={{ roundness: 20 }}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel"
                  accessibilityHint="Cancel editing and close dialog"
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleSaveEdit}
                  loading={submitting}
                  disabled={submitting || !editText.trim()}
                  style={styles.saveButton}
                  labelStyle={styles.saveButtonText}
                  theme={{ roundness: 20 }}
                  buttonColor={colors.primary}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Save comment"
                  accessibilityHint="Save the edited comment"
                  accessibilityState={{ disabled: submitting || !editText.trim() }}
                >
                  Save
                </Button>
              </View>
            </Card.Content>
          </Card>
        </KeyboardAvoidingView>
      )}

      {/* New Comment Input - At Top */}
      <View 
        style={styles.newCommentContainer}
        accessible={false}
      >
        <TextInput
          label="Add a comment..."
          value={newCommentText}
          onChangeText={setNewCommentText}
          mode="outlined"
          style={styles.commentInputTop}
          disabled={submitting}
          theme={{ roundness: 20 }}
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel="Add new comment"
          accessibilityHint="Enter a new comment here"
          right={
            <TextInput.Icon 
              icon={submitting ? "loading" : "send"}
              onPress={newCommentText.trim() ? handleSubmitNewComment : undefined}
              disabled={submitting || !newCommentText.trim()}
              color={newCommentText.trim() && !submitting ? colors.primary : colors.buttonDisabled}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Submit comment"
              accessibilityHint="Double tap to submit your comment"
              accessibilityState={{ disabled: submitting || !newCommentText.trim() }}
            />
          }
        />
      </View>

      {/* Comments List */}
      {loadingTaskComments && comments.length === 0 ? (
        <View 
          style={styles.loadingContainer}
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel="Loading comments"
        >
          <ActivityIndicator 
            size="large" 
            color={colors.primary}
            accessible={false}
          />
          <Text 
            variant="bodyMedium" 
            style={styles.loadingText}
            accessible={false}
          >
            Loading comments...
          </Text>
        </View>
      ) : comments.length === 0 ? (
        <View 
          style={styles.emptyContainer}
          accessible={true}
          accessibilityRole="text"
          accessibilityLabel="No comments yet. Be the first to comment!"
        >
          <Text 
            variant="bodyMedium" 
            style={styles.emptyText}
            accessible={false}
          >
            No comments yet. Be the first to comment!
          </Text>
        </View>
      ) : (
        <FlatList
          data={comments}
          renderItem={renderComment}
          keyExtractor={(item) => item.id.toString()}
          style={styles.commentsList}
          contentContainerStyle={styles.commentsContent}
          showsVerticalScrollIndicator={true}
          scrollEnabled={true}
          bounces={true}
          accessible={true}
          accessibilityRole="list"
          accessibilityLabel={`Comments list with ${comments.length} comments`}
          // onScroll={(event) => {
          //   console.log('FlatList scroll detected!', event.nativeEvent.contentOffset.y);
          //   console.log('Comments total:', comments.length, 'should need scroll if > 4');
          // }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={renderFooter}
        />
      )}

      {/* Success Snackbar */}
      <Snackbar
        visible={!!success}
        onDismiss={() => setSuccess('')}
        duration={3000}
        style={{ backgroundColor: colors.success }}
        accessible={true}
        accessibilityRole="alert"
        accessibilityLabel={`Success: ${success}`}
      >
        {success}
      </Snackbar>

      {/* Error Snackbar */}
      <Snackbar
        visible={!!error}
        onDismiss={() => setError('')}
        duration={5000}
        style={{ backgroundColor: colors.error }}
        accessible={true}
        accessibilityRole="alert"
        accessibilityLabel={`Error: ${error}`}
      >
        {error}
      </Snackbar>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        visible={dialogState.visible}
        title={dialogState.title}
        message={dialogState.message}
        buttons={dialogState.buttons}
        onDismiss={hideDialog}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 0,
    overflow: 'visible',
  },
  newCommentCard: {
    marginBottom: 16,
    backgroundColor: colors.backgroundPaper,
  },
  editModalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: 16,
    zIndex: 1000,
  },
  editCommentCard: {
    backgroundColor: colors.backgroundPaper,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 16,
    elevation: 8,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  editCommentContent: {
    padding: 20,
  },
  editTitle: {
    marginBottom: 16,
    color: colors.primary,
    fontWeight: '600',
    fontSize: 18,
    textAlign: 'center',
  },
  commentInput: {
    marginBottom: 16,
    backgroundColor: colors.backgroundDefault,
  },
  commentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 12,
  },
  submitButton: {
    backgroundColor: colors.primary,
  },
  saveButton: {
    backgroundColor: colors.primary,
    flex: 1,
    borderRadius: 20,
    elevation: 2,
  },
  saveButtonText: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    borderColor: colors.textSecondary,
    flex: 1,
    borderRadius: 20,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  commentsList: {
    flex: 1,
    height: 400,
  },
  commentsContent: {
    paddingBottom: 16,
  },
  commentCard: {
    marginBottom: 12,
    backgroundColor: colors.backgroundPaper,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  commentAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    backgroundColor: colors.avatarBg,
    borderWidth: 2,
    borderColor: colors.avatarOutline,
    marginRight: 12,
  },
  avatarLabel: {
    color: colors.textOnPrimary,
    fontWeight: 'bold',
    fontSize: 16,
  },
  menuButton: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  menuContent: {
    backgroundColor: colors.backgroundPaper,
    elevation: 9999,
    zIndex: 99999,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    minWidth: 120,
    marginTop: 0,
  },
  commentMeta: {
    flex: 1,
  },
  authorName: {
    fontWeight: '600',
    color: colors.textPrimary,
  },
  commentDate: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  commentContent: {
    color: colors.textPrimary,
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 16,
    color: colors.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
  },
  footerLoader: {
    padding: 16,
    alignItems: 'center',
  },
  newCommentContainer: {
    backgroundColor: colors.backgroundPaper,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    flexShrink: 0,
    marginBottom: 8,
  },
  commentInputTop: {
    backgroundColor: colors.backgroundDefault,
    fontSize: 14,
  },
});

export default TaskComments;

