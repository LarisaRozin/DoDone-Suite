/*
 * Copyright (c) 2025 Larisa Rozin
 * DoDone - Task Management, Allowance & Bonus Tracking Application
 * All rights reserved.
 */

import { getApp } from '@react-native-firebase/app';
import { getAnalytics, setAnalyticsCollectionEnabled, logEvent, logScreenView as firebaseLogScreenView, logLogin, setUserProperty } from '@react-native-firebase/analytics';
import { getPerformance, initializePerformance } from '@react-native-firebase/perf';
import { Platform } from 'react-native';

/**
 * Analytics Service for tracking user behavior and app performance
 * Centralizes Firebase Analytics and Performance Monitoring
 */
class AnalyticsService {
  private isAnalyticsEnabled: boolean = true;
  private isPerfEnabled: boolean = true;

  /**
   * Initialize the analytics service
   */
  async initialize(): Promise<void> {
    try {
      const app = getApp();
      const analytics = getAnalytics(app);
      
      // Enable analytics collection
      await setAnalyticsCollectionEnabled(analytics, this.isAnalyticsEnabled);
      
      // Enable performance monitoring
      await initializePerformance(app, { dataCollectionEnabled: this.isPerfEnabled });
      
      // Log app open event
      await logEvent(analytics, 'app_open');
    } catch (error) {
      console.error('Analytics Service: Initialization failed', error);
    }
  }

  /**
   * Track screen views
   */
  async logScreenView(screenName: string, screenClass?: string): Promise<void> {
    try {
      const app = getApp();
      const analytics = getAnalytics(app);
      await firebaseLogScreenView(analytics, {
        screen_name: screenName,
        screen_class: screenClass || screenName,
      });
    } catch (error) {
      console.error('Analytics Service: Screen view logging failed', error);
    }
  }

  /**
   * Track user actions
   */
  async logEvent(eventName: string, parameters?: Record<string, any>): Promise<void> {
    try {
      const app = getApp();
      const analytics = getAnalytics(app);
      await logEvent(analytics, eventName, parameters);
    } catch (error) {
      console.error('Analytics Service: Event logging failed', error);
    }
  }

  /**
   * Track task-related actions
   */
  async logTaskEvent(action: 'created' | 'completed' | 'deleted' | 'assigned', taskData?: {
    taskId?: string;
    category?: string;
    hasReward?: boolean;
    priority?: string;
  }): Promise<void> {
    try {
      const app = getApp();
      const analytics = getAnalytics(app);
      await logEvent(analytics, `task_${action}`, {
        task_id: taskData?.taskId,
        task_category: taskData?.category,
        has_reward: taskData?.hasReward,
        task_priority: taskData?.priority,
        platform: Platform.OS,
      });
    } catch (error) {
      console.error('Analytics Service: Task event logging failed', error);
    }
  }

  /**
   * Track allowance-related actions
   */
  async logAllowanceEvent(action: 'created' | 'approved' | 'denied' | 'paid', allowanceData?: {
    amount?: number;
    memberId?: string;
    category?: string;
  }): Promise<void> {
    try {
      const app = getApp();
      const analytics = getAnalytics(app);
      await logEvent(analytics, `allowance_${action}`, {
        amount: allowanceData?.amount,
        member_id: allowanceData?.memberId,
        allowance_category: allowanceData?.category,
        platform: Platform.OS,
      });
    } catch (error) {
      console.error('Analytics Service: Allowance event logging failed', error);
    }
  }

  /**
   * Track user engagement
   */
  async logEngagementEvent(action: 'login' | 'logout' | 'session_start' | 'session_end'): Promise<void> {
    try {
      const app = getApp();
      const analytics = getAnalytics(app);
      if (action === 'login') {
        await logLogin(analytics, { method: 'email' });
      } else {
        await logEvent(analytics, action, {
          platform: Platform.OS,
        });
      }
    } catch (error) {
      console.error('Analytics Service: Engagement event logging failed', error);
    }
  }

  /**
   * Set user properties
   */
  async setUserProperties(properties: Record<string, string | null>): Promise<void> {
    try {
      const app = getApp();
      const analytics = getAnalytics(app);
      for (const [key, value] of Object.entries(properties)) {
        await setUserProperty(analytics, key, value);
      }
    } catch (error) {
      console.error('Analytics Service: User properties setting failed', error);
    }
  }

  /**
   * Start performance trace for specific operations
   */
  async startTrace(traceName: string): Promise<any> {
    try {
      const app = getApp();
      const performance = getPerformance(app);
      const trace = await performance.startTrace(traceName);
      return trace;
    } catch (error) {
      console.error('Analytics Service: Performance trace start failed', error);
      return null;
    }
  }

  /**
   * Stop performance trace
   */
  async stopTrace(trace: any): Promise<void> {
    try {
      if (trace) {
        await trace.stop();
      }
    } catch (error) {
      console.error('Analytics Service: Performance trace stop failed', error);
    }
  }

  /**
   * Track API calls performance
   */
  async trackAPICall<T>(
    apiName: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    const trace = await this.startTrace(`api_${apiName}`);
    const startTime = Date.now();

    try {
      const result = await apiCall();
      
      if (trace) {
        trace.putAttribute('success', 'true');
        trace.putMetric('duration_ms', Date.now() - startTime);
      }

      await this.logEvent('api_call_success', {
        api_name: apiName,
        duration_ms: Date.now() - startTime,
      });

      return result;
    } catch (error) {
      if (trace) {
        trace.putAttribute('success', 'false');
        trace.putAttribute('error', error instanceof Error ? error.message : 'Unknown error');
        trace.putMetric('duration_ms', Date.now() - startTime);
      }

      await this.logEvent('api_call_error', {
        api_name: apiName,
        error_message: error instanceof Error ? error.message : 'Unknown error',
        duration_ms: Date.now() - startTime,
      });

      throw error;
    } finally {
      await this.stopTrace(trace);
    }
  }

  /**
   * Enable/Disable analytics collection
   */
  async setAnalyticsEnabled(enabled: boolean): Promise<void> {
    try {
      this.isAnalyticsEnabled = enabled;
      const app = getApp();
      const analytics = getAnalytics(app);
      await setAnalyticsCollectionEnabled(analytics, enabled);
    } catch (error) {
      console.error('Analytics Service: Setting analytics enabled failed', error);
    }
  }

  /**
   * Enable/Disable performance monitoring
   */
  async setPerformanceEnabled(enabled: boolean): Promise<void> {
    try {
      this.isPerfEnabled = enabled;
      const app = getApp();
      const performance = getPerformance(app);
      await performance.setPerformanceCollectionEnabled(enabled);
    } catch (error) {
      console.error('Analytics Service: Setting performance enabled failed', error);
    }
  }
}

export const analyticsService = new AnalyticsService();
export default AnalyticsService;