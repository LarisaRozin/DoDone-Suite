/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */
import React, { useState, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Modal, 
  Animated, 
  Dimensions,
  PanResponder,
  TouchableWithoutFeedback
} from 'react-native';
import { Text } from './StyledText';
import { colors } from '../defaultTheme';
import TaskComments from './TaskComments';

interface TaskCommentsModalProps {
  visible: boolean;
  onClose: () => void;
  taskId: number;
  taskName?: string;
  onCommentsChanged?: () => void;
}

const { height: screenHeight } = Dimensions.get('window');

export const TaskCommentsModal: React.FC<TaskCommentsModalProps> = ({
  visible,
  onClose,
  taskId,
  taskName,
  onCommentsChanged
}) => {
  const [commentCount, setCommentCount] = useState(0);
  const translateY = useRef(new Animated.Value(screenHeight)).current;
  
  // Use a simple height calculation  
  const modalHeight = screenHeight * 0.9;
  
  // Handle modal show/hide animations
  React.useEffect(() => {
    if (visible) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 8,
      }).start();
    } else {
      Animated.spring(translateY, {
        toValue: screenHeight,
        useNativeDriver: true,
        tension: 65,
        friction: 8,
      }).start();
    }
  }, [visible, translateY]);

  // Pan responder for drag-to-close
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to vertical drags from the handle area
        return Math.abs(gestureState.dy) > 5 && Math.abs(gestureState.dx) < Math.abs(gestureState.dy);
      },
      onPanResponderMove: (evt, gestureState) => {
        // Only allow downward dragging
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        // Close modal if dragged down more than 100px or with sufficient velocity
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          onClose();
        } else {
          // Snap back to original position
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      accessible={true}
      accessibilityViewIsModal={true}
      accessibilityLabel="Task comments modal"
    >
      <TouchableWithoutFeedback
        onPress={onClose}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Close modal"
        accessibilityHint="Double tap to close comments"
      >
        <View 
          style={styles.backdrop}
          accessible={false}
        />
      </TouchableWithoutFeedback>
      
      <Animated.View 
        style={[
          styles.modalContainer, 
          { 
            height: modalHeight,
            transform: [{ translateY }]
          }
        ]}
      >
        {/* Draggable Handle Area */}
        <View 
          style={styles.handleArea} 
          {...panResponder.panHandlers}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Drag handle"
          accessibilityHint="Swipe down to close comments"
        >
          <View 
            style={styles.dragHandle}
            accessible={false}
          />
        </View>
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text variant="headlineSmall" style={styles.headerTitle}>
              Comments{commentCount > 0 ? ` (${commentCount})` : ''}
            </Text>
            {taskName && (
              <Text variant="bodyMedium" style={styles.headerSubtitle} numberOfLines={1}>
                {taskName}
              </Text>
            )}
          </View>
        </View>

        {/* Comments Content */}
        <View style={styles.contentContainer}>
          <TaskComments 
            taskId={taskId}
            onCommentCountChange={setCommentCount}
            onCommentsChanged={onCommentsChanged}
          />
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.backgroundDefault,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    maxHeight: '90%',
    elevation: 10,
    overflow: 'visible',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  handleArea: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  dragHandle: {
    width: 36,
    height: 5,
    backgroundColor: colors.primary,
    borderRadius: 3,
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: 'Fredoka-SemiBold',
    fontSize: 18,
    fontWeight: '600',
    color: colors.primary,
  },
  headerSubtitle: {
    color: colors.textSecondary,
    marginTop: 2,
  },
  contentContainer: {
    flex: 1,
    overflow: 'visible',
  },
});

export default TaskCommentsModal;
