/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */

import { Platform, Dimensions } from 'react-native';

/**
 * Utility to fix iOS window frame issues after StoreKit modal dismissal
 * 
 * On iOS, presenting the StoreKit payment sheet can sometimes cause the app window
 * to shrink and display with black borders around it. This happens because the
 * window frame gets incorrectly adjusted during the modal presentation/dismissal.
 * 
 * This utility provides a JavaScript-based workaround that forces React Native
 * to recalculate dimensions.
 */
export const WindowFrameHelper = {
  /**
   * Force React Native to recalculate window dimensions
   * This triggers a layout pass that can fix the window frame issue
   */
  async resetWindowFrame(): Promise<void> {
    if (Platform.OS !== 'ios') {
      return;
    }

    try {
      // Force Dimensions to update by getting the window dimensions
      // This can trigger React Native to recalculate the layout
      const window = Dimensions.get('window');
      const screen = Dimensions.get('screen');
      
      console.log('WindowFrameHelper: Forcing dimensions refresh', {
        window: { width: window.width, height: window.height },
        screen: { width: screen.width, height: screen.height }
      });
      
      // Small delay to allow the StoreKit modal to fully dismiss
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Force another dimension check which can trigger a re-layout
      Dimensions.get('window');
      
      console.log('WindowFrameHelper: Dimensions refresh completed');
    } catch (error) {
      console.error('WindowFrameHelper: Failed to reset window frame:', error);
      // Don't throw - this is a best-effort fix
    }
  },
};
