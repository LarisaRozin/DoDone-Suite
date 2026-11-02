/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */

/**
 * Gesture Handler Utilities
 * Provides utility functions to help manage gesture handler state and recover from unresponsive states
 */

import { InteractionManager } from 'react-native';

/**
 * Force refresh of gesture handlers after modal interactions
 * This helps prevent the FlatList from becoming unresponsive after modals are closed
 */
export const refreshGestureHandlers = (callback?: () => void): void => {
  // Use InteractionManager to ensure this runs after any ongoing interactions
  InteractionManager.runAfterInteractions(() => {
    // Small delay to ensure modal animations complete
    setTimeout(() => {
      if (callback) {
        callback();
      }
    }, 150);
  });
};

/**
 * Simple debounce for gesture events to prevent rapid firing
 */
export const debounceGesture = <T extends any[]>(
  func: (...args: T) => void,
  wait: number
): ((...args: T) => void) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: T) => {
    // Clear any pending timeout
    if (timeout) {
      clearTimeout(timeout);
    }
    
    // Execute after delay
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
};

/**
 * Track gesture handler state for debugging purposes
 */
export class GestureTracker {
  private static instance: GestureTracker;
  private lastGesture: number = 0;
  private gestureCount: number = 0;
  private modalCount: number = 0;
  
  static getInstance(): GestureTracker {
    if (!GestureTracker.instance) {
      GestureTracker.instance = new GestureTracker();
    }
    return GestureTracker.instance;
  }
  
  recordGesture(): void {
    this.lastGesture = Date.now();
    this.gestureCount++;
  }
  
  recordModalInteraction(): void {
    this.modalCount++;
  }
  
  isUnresponsive(): boolean {
    const timeSinceLastGesture = Date.now() - this.lastGesture;
    const hasModalInteractions = this.modalCount > 0;
    
    // Consider unresponsive if no gestures in 30 seconds after modal interactions
    return hasModalInteractions && timeSinceLastGesture > 30000;
  }
  
  reset(): void {
    this.lastGesture = Date.now();
    this.gestureCount = 0;
    this.modalCount = 0;
  }
}